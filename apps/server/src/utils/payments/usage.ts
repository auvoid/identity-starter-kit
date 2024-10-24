import { Organization } from '../../entities';
import { getDataSource } from '../../main';
import Stripe from 'stripe';

export const reportUsageMetrics = async (
    organizationId: string,
    usage: number,
) => {
    const orgRepo = getDataSource().getRepository(Organization);
    const {
        subscription: { subscriptionId },
    } = await orgRepo.findOne({
        where: { id: organizationId },
        relations: { subscription: true },
    });
    if (!subscriptionId) return;
    const stripe = new Stripe(process.env.STRIPE_SECRET);
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subscriptionItem = subscription.items.data[0].id;
    await stripe.subscriptionItems.createUsageRecord(subscriptionItem, {
        quantity: usage,
    });
};
