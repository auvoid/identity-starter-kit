import { Inject, Injectable, forwardRef } from '@nestjs/common';
import sgMail from '@sendgrid/mail';
import {
    Application,
    BatchIssuance,
    Organization,
    Subscription,
    Template,
    User,
    UserInvite,
} from '../../entities';
import { ApplicationsService } from '../applications/applications.service';
import { createJsonWebToken } from '../../utils';
import { reportUsageMetrics } from '../../utils/payments/usage';
import jwt from 'jsonwebtoken';
import { CredentialIssuanceService } from '../credential-issuance/credential-issuance.service';

@Injectable()
export class EmailService {
    constructor(
        @Inject(forwardRef(() => ApplicationsService))
        private applicationService: ApplicationsService,
        private credentialIsuanceService: CredentialIssuanceService,
    ) {
        sgMail.setApiKey(process.env.SENDGRID_KEY);
    }

    async sendOrgOwnerRotationEmail({
        url,
        user,
    }: {
        url: string;
        user: User;
    }) {
        const logoPath = new URL(
            '/images/Logo.png',
            process.env.PUBLIC_CLIENT_URI,
        ).toString();
        const msg = {
            from: 'AuvoID <no-reply@auvo.io>',
            to: user.email,
            subject: `Security: Change Owner DID`,
            html: `
                <div style="background: #f2f2f2; padding: 20px; font-family: sans-serif; text-align: center">
			<div style="text-align: center; padding: 20px;">
				<img src="${logoPath}" style="height: 65px; width: 65px; object-fit: cover; border-radius: 5px;" />
			</div>
                <h2>AuvoID</h2>
			<h1>Hello!</h1>
                <p>You have requested to change your DID</p>
                <p>You have requested the Owner of your organization's DID to be changed, please be warned this is an irreversible action and will make your new DID the owner of your organization, please proceed with caution.</p>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <center>
                      <a href="${url}" style="text-decoration: none">
                        <button style="padding: 12px 25px; display: block; text-decoration: none; color: #3d3d3d; background: #DEC071; width: fit-content; border-radius: 5px; border: none;"> Change Owner DID</button>
                      </a>
                    </center>
                  </td>
                </tr>
              </table
                </div>
                `,
        };
        await sgMail.send(msg);
    }
    async sendDeferredStepActionUpdateEmail(application: Application) {
        const logoPath =
            application.template.icon ??
            application.organization.logo ??
            new URL(
                '/images/Logo.png',
                process.env.PUBLIC_CLIENT_URI,
            ).toString();
        const token = createJsonWebToken(
            {
                applicationId: application.id,
                scope: 'flow-credential-application',
            },
            '30d',
        );
        const url = new URL(
            `/apply/applications/${application.id}?token=${token}`,
            process.env.PUBLIC_CLIENT_URI,
        ).toString();
        const msg = {
            from: 'AuvoID <no-reply@auvo.io>',
            to: application.email,
            subject: `Your application for ${application.template.name} has been processed`,
            html: `
                        <div style="background: #f2f2f2; padding: 20px; font-family: sans-serif; text-align: center">
			<div style="text-align: center; padding: 20px;">
				<img src="${logoPath}" style="height: 65px; width: 65px; object-fit: cover; border-radius: 5px;" />
			</div>
                        <h2>Your application for ${application.template.name} has been processed</h2>
			<h1>Hello!</h1>
                        <p>Your application for ${application.template.name} has been reviewed by ${application.organization.name}, and an action has been taken by them, click the button below to check it out</p>
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="text-align: center;">
                            <center>
                              <a href="${url}" style="text-decoration: none">
                                <button style="padding: 12px 25px; display: block; text-decoration: none; color: #3d3d3d; background: #DEC071; width: fit-content; border-radius: 5px; border: none;">View Application</button>
                              </a>
                            </center>
                          </td>
                        </tr>
                      </table
                        </div>
                        `,
        };
        await sgMail.send(msg);
    }

    async sendDeferredStepActionEmail(application: Application) {
        const logoPath =
            application.template.icon ??
            application.organization.logo ??
            new URL(
                '/images/Logo.png',
                process.env.PUBLIC_CLIENT_URI,
            ).toString();
        const token = createJsonWebToken(
            {
                applicationId: application.id,
                scope: 'flow-credential-application',
            },
            '30d',
        );
        const url = new URL(
            `/apply/applications/${application.id}?token=${token}`,
            process.env.PUBLIC_CLIENT_URI,
        ).toString();

        const msg = {
            from: 'AuvoID <no-reply@auvo.io>',
            to: application.email,
            subject: `Your Application is now being reviwed by ${application.organization.name}`,
            html: `
                      <div style="background: #f2f2f2; padding: 20px; font-family: sans-serif; text-align: center">
			<div style="text-align: center; padding: 20px;">
				<img src="${logoPath}" style="height: 65px; width: 65px; object-fit: cover; border-radius: 5px;" />
			</div>
                      <h2>Your application for ${application.template.name} is being reviewed</h2>
			<h1>Hello!</h1>
                      <p>Your application for ${application.template.name} is being reviewed by ${application.organization.name}, it may take a few hours but you can always continue it by clicking this link</p>
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="text-align: center;">
                          <center>
                            <a href="${url}" style="text-decoration: none">
                              <button style="padding: 12px 25px; display: block; text-decoration: none; color: #3d3d3d; background: #DEC071; width: fit-content; border-radius: 5px; border: none;">View Application</button>
                            </a>
                          </center>
                        </td>
                      </tr>
                    </table
                      </div>
                      `,
        };
        await sgMail.send(msg);
    }

    async sendUserDidRotateEmail({ url, user }: { url: string; user: User }) {
        const logoPath = new URL(
            '/images/Logo.png',
            process.env.PUBLIC_CLIENT_URI,
        ).toString();
        const msg = {
            from: 'AuvoID <no-reply@auvo.io>',
            to: user.email,
            subject: `Security: Change Owner DID`,
            html: `
                <div style="background: #f2f2f2; padding: 20px; font-family: sans-serif; text-align: center">
			<div style="text-align: center; padding: 20px;">
				<img src="${logoPath}" style="height: 65px; width: 65px; object-fit: cover; border-radius: 5px;" />
			</div>
                <h2>AuvoID</h2>
			<h1>Hello!</h1>
                <p>You have requested to change your DID</p>
                <p>You have requested your DID to be changed, please be warned this is an irreversible action and will make your new DID your only way to be able to access your account, please proceed with caution.</p>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <center>
                      <a href="${url}" style="text-decoration: none">
                        <button style="padding: 12px 25px; display: block; text-decoration: none; color: #3d3d3d; background: #DEC071; width: fit-content; border-radius: 5px; border: none;"> Change DID</button>
                      </a>
                    </center>
                  </td>
                </tr>
              </table
                </div>
                `,
        };
        await sgMail.send(msg);
    }

    async sendSubscriptionChangeRequest({
        plan,
        user,
        subscription,
    }: {
        plan: string;
        user: User;
        subscription: Subscription;
    }) {
        const message = {
            from: 'Auvo ID <no-reply@auvo.io>',
            to: 'team@auvo.io',
            replyTo: user.organization.contactEmail,
            subject: `Subscription Change Request: ${user.organization.name}`,
            html: `
            <html>
            <body>
            <p>Organization: ${user.organization.name}</p>
            <p>Plan to change to: ${plan}</p>
            <p>Stripe ID: ${subscription.stripeId}</p>
            </body>
            </html>
            `,
        };
        await sgMail.send(message);
    }

    async sendUserEmailVerification({ user }: { user: User }) {
        const logoPath = new URL(
            '/images/Logo.png',
            process.env.PUBLIC_CLIENT_URI,
        ).toString();
        const token = jwt.sign(
            {
                scope: 'email-verification',
                userId: user.id,
                context: 'user',
            },
            process.env.SESSION_SECRET,
            {
                expiresIn: '1h',
            },
        );
        const verificationLink = `
          ${process.env.PUBLIC_CLIENT_URI}/verify-email?token=${token}
        `;
        const message = {
            from: 'Auvo ID <no-reply@auvo.io>',
            to: user.email,
            subject: `Email Verification Request for AuvoID`,
            html: `
          <html>
          <body>
          <div style="background: #f2f2f2; padding: 20px; font-family: sans-serif; text-align: center">
            <div style="text-align: center; padding: 20px;">
              <img src="${logoPath}" style="height: 65px; width: 65px; object-fit: cover; border-radius: 5px;" />
            </div>
            <h2>AuvoID</h2>
            <h1>Hello!</h1>
            <p>Please verify your Email by clicking the link below!</p>
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td style="text-align: center;">
                  <center>
                    <a href="${verificationLink}" style="text-decoration: none">
                      <button style="padding: 12px 25px; display: block; text-decoration: none; color: #3d3d3d; background: #DEC071; width: fit-content; border-radius: 5px; border: none;"> Verify Email</button>
                    </a>
                  </center>
                </td>
              </tr>
            </table>
            <p>If the button does not work, please click on the link below</p>
            <p>${verificationLink}</p>
          </div>
          </body>
          </html>
          `,
        };
        await sgMail.send(message);
    }

    async sendOrgEmailVerification({ org }: { org: Organization }) {
        const logoPath = new URL(
            '/images/Logo.png',
            process.env.PUBLIC_CLIENT_URI,
        ).toString();
        const token = jwt.sign(
            {
                scope: 'email-verification',
                userId: org.id,
                context: 'org',
            },
            process.env.SESSION_SECRET,
            {
                expiresIn: '1h',
            },
        );
        const verificationLink = `
        ${process.env.PUBLIC_CLIENT_URI}/organization-settings/verify-email?token=${token}
      `;
        const message = {
            from: 'Auvo ID <no-reply@auvo.io>',
            to: org.contactEmail,
            subject: `Email Verification Request for AuvoID`,
            html: `
        <html>
        <body>
        <div style="background: #f2f2f2; padding: 20px; font-family: sans-serif; text-align: center">
          <div style="text-align: center; padding: 20px;">
            <img src="${logoPath}" style="height: 65px; width: 65px; object-fit: cover; border-radius: 5px;" />
          </div>
          <h2>AuvoID</h2>
          <h1>Hello!</h1>
          <p>Please verify your organization contact Email by clicking the link below!</p>
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="text-align: center;">
                <center>
                  <a href="${verificationLink}" style="text-decoration: none">
                    <button style="padding: 12px 25px; display: block; text-decoration: none; color: #3d3d3d; background: #DEC071; width: fit-content; border-radius: 5px; border: none;"> Verify Email</button>
                  </a>
                </center>
              </td>
            </tr>
          </table>
          <p>If the button does not work, please click on the link below</p>
          <p>${verificationLink}</p>
        </div>
        </body>
        </html>
        `,
        };
        await sgMail.send(message);
    }

    async sendBatchCredentials(
        template: Template,
        recipients: Record<string, any>[],
        user: User,
        batchIssuance: BatchIssuance = null,
    ) {
        const { organization } = template;
        const badEmailRows = recipients
            .map((recipient, i) => {
                if (
                    /[A-Za-z0-9\._%+\-]+@[A-Za-z0-9\.\-]+\.[A-Za-z]{2,}/.test(
                        recipient.email,
                    )
                )
                    return null;
                // + 2 cuz first we translate from 0 indexed to 1 index for humans
                // and another one is added because there is an additional header
                // row in CSVs which we need to account for, this creates the perfect
                // placement of rows as someone would see it in their editor
                // thanks for reading this comment K Thx Byeeee!!!
                return i + 2;
            })
            .filter((e) => !!e);
        if (badEmailRows.length > 0)
            throw new Error(
                'Bad emails provided in rows ' + badEmailRows.join(', '),
            );

        const applicationsEnriched = recipients.map((recipient) => ({
            body: recipient,
            status: 'approved',
            organization,
            email: recipient.email,
            template,
            batchIssuance,
            approvalTimeStamp: new Date(Date.now()),
            processedBy: user,
        }));

        const applicationsRaw = await this.applicationService.createBulk(
            applicationsEnriched as Application[],
        );

        const logoPath =
            organization.logo ??
            new URL(
                '/images/Logo.png',
                process.env.PUBLIC_CLIENT_URI,
            ).toString();

        const applications = await Promise.all(
            applicationsRaw.map(async (application) => {
                const token = createJsonWebToken(
                    { applicationId: application.id },
                    '7d',
                );
                const inviteLink = new URL(
                    `/accept-credential?token=${token}`,
                    process.env.PUBLIC_CLIENT_URI,
                );
                return { ...application, token, inviteLink };
            }),
        );

        await reportUsageMetrics(organization.id, recipients.length);
        const messages = applications.map((a) => ({
            from: 'Auvo ID <no-reply@auvo.io>',
            to: a.email,
            subject: `You have received a new credential from ${organization.name}`,
            html: `
            <div style="background: #f2f2f2; padding: 20px; font-family: sans-serif; text-align: center">
            <div style="text-align: center; padding: 20px;">
              <img src="${logoPath}" style="height: 65px; width: 65px; object-fit: cover; border-radius: 5px;" />
            </div>
            <h2>${organization.name}</h2>
            <h1>Hello!</h1>
            <p>You have been issued the credential <b>${template.name}</b> by ${organization.name} on Auvo ID </p>
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td style="text-align: center;">
                  <center>
                    <a href="${a.inviteLink}" style="text-decoration: none">
                      <button style="padding: 12px 25px; display: block; text-decoration: none; color: #3d3d3d; background: #DEC071; width: fit-content; border-radius: 5px; border: none;"> Accept Credential </button>
                    </a>
                  </center>
                </td>
              </tr>
            </table>
          </div>
            `,
        }));

        await sgMail.send(messages);
    }

    async sendOrganizationInvite(invite: UserInvite) {
        const inviteJWT = createJsonWebToken({ inviteId: invite.id }, '7d');

        const inviteLink = new URL(
            `/accept-invite?token=${inviteJWT}`,
            process.env.PUBLIC_CLIENT_URI,
        ).toString();
        const logoPath =
            invite.organization.logo ??
            new URL(
                '/images/Logo.png',
                process.env.PUBLIC_CLIENT_URI,
            ).toString();
        const msg = {
            from: 'AuvoID <no-reply@auvo.io>',
            to: invite.email,
            subject: `You been invited to join ${invite.organization.name}`,
            html: `
                <div style="background: #f2f2f2; padding: 20px; font-family: sans-serif; text-align: center">
			<div style="text-align: center; padding: 20px;">
				<img src="${logoPath}" style="height: 65px; width: 65px; object-fit: cover; border-radius: 5px;" />
			</div>
                <h2>${invite.organization.name}</h2>
			<h1>Hello!</h1>
                <p>You have been invited to join ${invite.organization.name} on Auvo ID</p>
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <center>
                      <a href="${inviteLink}" style="text-decoration: none">
                        <button style="padding: 12px 25px; display: block; text-decoration: none; color: #3d3d3d; background: #DEC071; width: fit-content; border-radius: 5px; border: none;"> Accept Invite</button>
                      </a>
                    </center>
                  </td>
                </tr>
              </table
                </div>
                `,
        };
        sgMail.send(msg);
    }
}
