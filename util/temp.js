let registrationData = null;
let emailData = null;

module.exports = {
    getRegistrationData: () => registrationData,
    setRegistrationData: (data) => {
        registrationData = data;
    },
    clearRegistrationData: () => {
        registrationData = null;
    },
    getemailData: () => emailData,
    setemailData: (data) => {
        emailData = data;
    },
    clearemailData: () => {
        emailData = null;
    },
};