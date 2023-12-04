let registrationData = null;

module.exports = {
    getRegistrationData: () => registrationData,
    setRegistrationData: (data) => {
        registrationData = data;
    },
    clearRegistrationData: () => {
        registrationData = null;
    },
};