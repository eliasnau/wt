import { feature, item, plan } from 'atmn';

// Features
export const members = feature({
	id: 'members',
	name: 'Members',
	type: 'metered',
	consumable: false,
});

export const ai_messages = feature({
	id: 'ai_messages',
	name: 'AI Messages',
	type: 'metered',
	consumable: true,
});

export const users = feature({
	id: 'users',
	name: 'Users',
	type: 'metered',
	consumable: false,
});

// Plans
export const free = plan({
	id: 'free',
	name: 'Free',
	autoEnable: true,
	items: [
		item({
			featureId: members.id,
			included: 5,
		}),
		item({
			featureId: users.id,
			included: 1,
		}),
	],
});

export const basic = plan({
	id: 'basic',
	name: 'Basic',
	price: {
		amount: 20,
		interval: 'month',
	},
	items: [
		item({
			featureId: ai_messages.id,
			included: 250,
			reset: {
				interval: 'month',
			},
		}),
		item({
			featureId: members.id,
			included: 100,
		}),
		item({
			featureId: users.id,
			included: 2,
		}),
	],
});

export const pro = plan({
	id: 'pro',
	name: 'Pro',
	price: {
		amount: 49,
		interval: 'month',
	},
	items: [
		item({
			featureId: ai_messages.id,
			included: 500,
			reset: {
				interval: 'month',
			},
		}),
	],
});

export const enterprise = plan({
	id: 'enterprise',
	name: 'Enterprise',
	price: {
		amount: 100,
		interval: 'month',
	},
	items: [
		item({
			featureId: ai_messages.id,
			included: 1000,
			reset: {
				interval: 'month',
			},
		}),
	],
});

export const ai_credits = plan({
	id: 'ai_credits',
	name: 'AI Credits',
	addOn: true,
	price: {
		amount: 5,
		interval: 'one_off',
	},
	items: [
		item({
			featureId: ai_messages.id,
			included: 500,
			reset: {
				interval: 'month',
			},
		}),
	],
});
