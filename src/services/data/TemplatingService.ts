import { Candidate, Recruiter } from "./dtos";
import * as fs from 'fs';
import * as path from 'path';
import * as act from 'adaptivecards-templating';


export class TemplatingService {

    candidateTemplate: string = "";
    templatesPath: string = "";

    public load(templatesPath: string) {
        this.templatesPath = templatesPath;
        this.candidateTemplate = fs.readFileSync(path.join(templatesPath, "candidateTemplate.json")).toString();
    }

    public getCandidateTemplate(candidate: Candidate, recruiters: Recruiter[], status?: string): any {
        this.candidateTemplate = fs.readFileSync(path.join(this.templatesPath, "candidateTemplate.json")).toString();
        const template = new act.Template(JSON.parse(this.candidateTemplate));
        const payload = template.expand({
            $root: {
                ...candidate,
                recruiters,
                hasComments: candidate.comments && candidate.comments.length > 0,
                status: status || "",
                candidateFeedbackUrl: `https://teams.microsoft.com/l/task/${process.env.TeamsAppId}?url=${encodeURIComponent(`${process.env.BaseUrl}/StaticViews/CandidateFeedback.html?candidateId=${candidate.id}`)}&title=${encodeURIComponent(`Feedback for ${candidate.name}`)}&completionBotId=${process.env.MicrosoftAppId}&height=large&width=large`
            }
        });

        return payload;
    }
}
