import { Candidate, Position, Recruiter, Location, CardListItem, ListCard } from "./dtos";
import * as fs from 'fs';
import * as path from 'path';
import * as act from 'adaptivecards-templating';
import { Attachment, CardFactory, CardImage } from "botbuilder";


export class TemplatingService {

    candidateTemplate: string = "";
    positionTemplate: string = "";
    newPositionTempalte: string = "";
    templatesPath: string = "";

    public load(templatesPath: string) {
        this.templatesPath = templatesPath;
        this.candidateTemplate = fs.readFileSync(path.join(templatesPath, "candidateTemplate.json")).toString();
        this.positionTemplate = fs.readFileSync(path.join(templatesPath, "positionTemplate.json")).toString();
        this.newPositionTempalte = fs.readFileSync(path.join(templatesPath, "newPositionTemplate.json")).toString();
    }

    public getCandidateTemplate(candidate: Candidate, recruiters: Recruiter[], status?: string, renderActions: boolean = true): any {
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
        return CardFactory.thumbnailCard(
            candidate.name, 
            [candidate.profilePicture], 
            undefined, 
            { 
                text: `Current role: ${candidate.currentRole} | ${candidate.location?.locationAddress}`
            }
        );
    }

    public getCandidatesAsListTemplate(candidates: Candidate[], tapCommand: string, title: string): Attachment {
        const items: CardListItem[] = [];

        candidates.forEach(x => {
            items.push({
                icon: x.profilePicture,
                type: "resultItem",
                title: `<strong>${x.name}</strong>`,
                subtitle: `Current role: ${x.currentRole} | Stage: ${x.stage} | ${x.location?.locationAddress}`,
                tap: {
                    type: "imback",
                    value: `${tapCommand} ${x.name}`,
                    title: ""
                }
            })
        });

        return {
            contentType: "application/vnd.microsoft.teams.card.list",
            content: <ListCard>{
                title,
                items
            }
        }
    }

    public getPositionsAsListTemplate(positions: Position[], tapCommand: string, title: string): Attachment {
        const items: CardListItem[] = [];

        positions.forEach(x => {
            items.push({
                icon: x.hiringManager?.profilePicture || "",
                type: "resultItem",
                title: `<strong>${x.id} - ${x.title}</strong>`,
                subtitle: `Applicants: ${x.candidates.length} | Hiring manager: ${x.hiringManager?.name} | Days open ${x.daysOpen}`,
                tap: {
                    type: "imback",
                    value: `${tapCommand} ${x.externalId}`,
                    title: ""
                }
            })
        });

        return {
            contentType: "application/vnd.microsoft.teams.card.list",
            content: <ListCard>{
                title,
                items
            }
        }
    }

    public getPositionPreviewTemplate(position: Position): Attachment {
        return CardFactory.thumbnailCard(
            `${position.title} / ${position.externalId}`, 
            undefined, 
            undefined, 
            {
            text: `Hiring manager: ${position.hiringManager?.name} | ${position.location?.locationAddress}`
            }
        );
    }

    public getPositionTemplate(position: Position, renderActions: boolean = false): any {
        const template = new act.Template(JSON.parse(this.positionTemplate));
        const payload = template.expand({
            $root: {
                ...position,
                renderActions
            }
        });

        return payload;
    }

    public getNewPositionTemplate(recruiters: Recruiter[], locations: Location[], levels: number[]): any {
        const template = new act.Template(JSON.parse(this.newPositionTempalte));
        const payload = template.expand({
            $root: {
                recruiters,
                locations,
                levels
            }
        });
        return payload;
    }
}
