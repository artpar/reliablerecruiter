import React from 'react';
import {useNavigate} from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

interface ComingSoonPageProps {
    toolName?: string;
    description?: string;
}

const ComingSoonPage: React.FC<ComingSoonPageProps> = ({
                                                           toolName = '' +
                                                           'This Tool',
                                                           description = 'We\'re working hard to bring you this functionality soon. Please check back later!'
                                                       }) => {
    const navigate = useNavigate();

    return (
        <div className="max-w-4xl mx-auto py-8">
            <Card className="text-center p-8">
                <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="">
                        <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                             xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold ">{toolName} Is Coming Soon</h1>

                    <p className="text-lg  max-w-lg">
                        {description}
                    </p>

                    <div className="p-6 rounded-lg border border-neutral-200 w-full max-w-md mt-4">
                        <h2 className="text-lg font-medium  mb-2">Want to be notified?</h2>
                        <p className=" mb-4">
                            Join our waiting list to be among the first to know when this tool becomes available.
                        </p>
                        <Button
                            variant="outline"
                            fullWidth
                            onClick={() => window.alert('This feature is not yet implemented.')}
                        >
                            Join Waiting List
                        </Button>
                    </div>

                    <Button
                        variant="primary"
                        leftIcon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                 xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                            </svg>
                        }
                        onClick={() => navigate('/')}
                        className="mt-6"
                    >
                        Return to Home
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default ComingSoonPage;
