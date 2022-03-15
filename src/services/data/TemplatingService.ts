import { Candidate, Position, Recruiter } from "./dtos";
import * as fs from 'fs';
import * as path from 'path';
import * as act from 'adaptivecards-templating';
import { Attachment, CardFactory, CardImage } from "botbuilder";


export class TemplatingService {

    candidateTemplate: string = "";
    positionTemplate: string = "";
    templatesPath: string = "";

    public load(templatesPath: string) {
        this.templatesPath = templatesPath;
        this.candidateTemplate = fs.readFileSync(path.join(templatesPath, "candidateTemplate.json")).toString();
        this.positionTemplate = fs.readFileSync(path.join(templatesPath, "positionTemplate.json")).toString();
    }

    public getCandidateTemplate(candidate: Candidate, recruiters: Recruiter[], status?: string, renderActions: boolean = true): any {
        this.candidateTemplate = fs.readFileSync(path.join(this.templatesPath, "candidateTemplate.json")).toString();
        const template = new act.Template(JSON.parse(this.candidateTemplate));
        const payload = template.expand({
            $root: {
                ...candidate,
                recruiters,
                hasComments: candidate.comments && candidate.comments.length > 0,
                status: status || "",
                candidateFeedbackUrl: `https://teams.microsoft.com/l/task/${process.env.TeamsAppId}?url=${encodeURIComponent(`${process.env.BaseUrl}/StaticViews/CandidateFeedback.html?candidateId=${candidate.id}`)}&title=${encodeURIComponent(`Feedback for ${candidate.name}`)}&completionBotId=${process.env.MicrosoftAppId}&height=large&width=large`,
                renderActions
            }
        });

        return payload;
    }

    public getCandidatePreviewTemplate(candidate: Candidate): Attachment {
        return {
            contentType: CardFactory.contentTypes.thumbnailCard,
            content: {
                title: candidate.name,
                text: `Current role: ${candidate.currentRole} | ${candidate.location?.locationAddress}`,
                images: [
                    {
                        url: candidate.profilePicture
                    }
                ]
            }
        }
    }

    public getPositionPreviewTemplate(position: Position): Attachment {
        return {
            contentType: CardFactory.contentTypes.thumbnailCard,
            content: {
                title: `${position.title} / ${position.externalId}`,
                text: `Hiring manager: ${position.hiringManager?.name} | ${position.location?.locationAddress}`
            }
        }
    }

    public getPositionTemplate(position: Position): any {
        this.positionTemplate = fs.readFileSync(path.join(this.templatesPath, "positionTemplate.json")).toString();
        const template = new act.Template(JSON.parse(this.positionTemplate));
        const payload = template.expand({
            $root: {
                ...position
            }
        });

        return payload;
    }
}
