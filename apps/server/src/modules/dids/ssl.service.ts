import acme from 'acme-client';
import fs from 'fs';
import path from 'path';
import { Injectable } from '@nestjs/common';
import { ChallengesService } from './challenge.service';

const pendingDomains = {};

@Injectable()
export class SslService {
    constructor(private challengeService: ChallengesService) {}

    async sslAlreadyExists(servername: string) {
        const exists = await fs.promises
            .access(path.join(process.env.CERTS_PATH, servername))
            .then(() => true)
            .catch(() => false);
        return exists;
    }

    async getCertOnDemand(servername: string, attempt = 0) {
        const client = new acme.Client({
            directoryUrl: acme.directory.letsencrypt.production,
            accountKey: await acme.crypto.createPrivateKey(),
        });
        console.log('provisioning cert for ', servername);
        /* Waiting on certificate order to go through */
        if (servername in pendingDomains) {
            if (attempt >= 10) {
                throw new Error(
                    `Gave up waiting on certificate for ${servername}`,
                );
            }

            await new Promise((resolve) => {
                setTimeout(resolve, 1000);
            });
            return this.getCertOnDemand(servername, attempt + 1);
        }

        const [key, csr] = await acme.crypto.createCsr({
            commonName: servername,
        });

        const cert = await client.auto({
            csr,
            email: 'ssl@auvo.io',
            termsOfServiceAgreed: true,
            challengePriority: ['http-01'],
            challengeCreateFn: async (authz, challenge, keyAuthorization) => {
                await this.challengeService.create({
                    id: challenge.token,
                    response: keyAuthorization,
                });
            },
            challengeRemoveFn: async (authz, challenge) => {
                await this.challengeService.findByIdAndDelete(challenge.token);
            },
        });

        delete pendingDomains[servername];
        console.log(`Certificate for ${servername} created successfully`);

        // Write key and cert to files
        const domainDirectory = path.join(process.env.CERTS_PATH, servername);
        fs.mkdirSync(domainDirectory, { recursive: true });
        fs.writeFileSync(path.join(domainDirectory, 'key.pem'), key.toString());
        fs.writeFileSync(
            path.join(domainDirectory, 'cert.pem'),
            cert.toString(),
        );

        return [key, cert];
    }
}
