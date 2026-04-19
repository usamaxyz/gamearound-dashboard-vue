import { Amplify } from 'aws-amplify';

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: 'eu-central-1_BIxQEi7ju',
            userPoolClientId: '19u81s4v4sd3mmmbnuog2vfc1e',
            signUpVerificationMethod: 'code'
        }
    }
});

export default Amplify;
