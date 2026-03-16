export const OTP_MAX_LENGTH = 6;

export const useTwoFactorAuth = () => ({
    enabled: false,
    confirmed: false,
    qrCode: null,
    recoveryCodes: [] as string[],
    showSetup: false,
    showRecoveryCodes: false,
    loading: false,
    enable: async () => undefined,
    confirm: async () => undefined,
    disable: async () => undefined,
    generateRecoveryCodes: async () => undefined,
    showRecovery: () => undefined,
    hideRecovery: () => undefined,
});
