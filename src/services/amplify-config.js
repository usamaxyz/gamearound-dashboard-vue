import { Amplify } from 'aws-amplify';

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: 'eu-central-1_bT03Gs2dg',
            userPoolClientId: '1rmn4uh4tmuaqhijaifq1pk98l',
            signUpVerificationMethod: 'code'
        }
    }
});

export default Amplify;
