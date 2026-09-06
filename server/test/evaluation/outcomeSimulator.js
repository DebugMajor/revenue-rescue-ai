const RECOVERY_RULES = {
    NETWORK_ERROR: {
        RETRY_NOW: 0.80,
        WAIT_AND_RETRY: 0.75,
        SEND_PAYMENT_LINK: 0.70
    },

    TIMEOUT: {
        RETRY_NOW: 0.65,
        WAIT_AND_RETRY: 0.75,
        SEND_PAYMENT_LINK: 0.55
    },

    GATEWAY_ERROR: {
        RETRY_NOW: 0.55,
        WAIT_AND_RETRY: 0.65,
        SEND_PAYMENT_LINK: 0.50
    },

    CARD_DECLINED: {
        RETRY_NOW: 0.20,
        WAIT_AND_RETRY: 0.15,
        SEND_PAYMENT_LINK: 0.35
    },

    INSUFFICIENT_FUNDS: {
        RETRY_NOW: 0.05,
        WAIT_AND_RETRY: 0.10,
        SEND_PAYMENT_LINK: 0.30
    }
};

/*
 * Convert an event ID such as EVAL_0042 into a deterministic
 * number between 0 and 99.
 *
 * This means:
 *
 * same event + same action = same outcome
 *
 * across every strategy.
 */
const deterministicBucket = (eventId, action) => {
    const input = `${eventId}:${action}`;

    let hash = 0;

    for (let i = 0; i < input.length; i += 1) {
        hash =
            (hash * 31 +
                input.charCodeAt(i)) %
            1000003;
    }

    return hash % 100;
};

const simulateRecovery = (
    event,
    action
) => {
    const rule =
        RECOVERY_RULES[event.errorCode]?.[action];

    if (rule === undefined) {
        return {
            recovered: false,
            probability: 0
        };
    }

    const bucket =
        deterministicBucket(
            event.eventId,
            action
        );

    const recovered =
        bucket <
        rule * 100;

    return {
        recovered,
        probability: rule,
        bucket
    };
};

export {
    RECOVERY_RULES,
    simulateRecovery
};