import React, {useState} from 'react';
import TextArea from "../../components/common/TextArea";
import Button from "../../components/common/Button";

interface JDInputProps {
    onAnalyze: (text: string) => void;
    isAnalyzing: boolean;
}

const JDInput: React.FC<JDInputProps> = ({onAnalyze, isAnalyzing}) => {
    const [jobDescription, setJobDescription] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setJobDescription(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (jobDescription.trim()) {
            onAnalyze(jobDescription);
        }
    };

    const handleUseExample = () => {
        const exampleJD = `We're looking for a rockstar developer to join our team. The ideal candidate is a hard-working guy who can handle the fast-paced environment of a young startup. You should be a coding ninja who thrives under pressure and isn't afraid to work long hours. This role requires strong technical chops and a driven attitude. We need someone energetic who can hit the ground running, with fresh ideas and a killer instinct for solving problems. If you're a seasoned veteran with 10+ years of experience or a young gun with natural talent, we want to hear from you.`;

        setJobDescription(exampleJD);
    };

    return (<form onSubmit={handleSubmit}>
            <div className="mb-4">
                <TextArea
                    id="job-description"
                    label="Job Description"
                    value={jobDescription}
                    onChange={handleChange}
                    rows={10}
                    className="dark:text-white dark:bg-black"
                    placeholder="Paste your job description here..."
                    helperText="We'll analyze the text for potentially biased or exclusionary language."
                />
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseExample}
                >
                    Use Example JD
                </Button>

                <Button
                    type="submit"
                    variant="success"
                    isLoading={isAnalyzing}
                    disabled={!jobDescription.trim() || isAnalyzing}
                >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
                </Button>
            </div>
        </form>);
};

export default JDInput;
