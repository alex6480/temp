import * as React from "react";
import IFlashCard from "../../lib/flashcard/flashcard";
import IFlashCardSet, { ExportFlashCardSet } from "../../lib/flashcard/FlashCardSet";
import { ICardStudyData, ISetStudyData } from "../../lib/flashcard/StudyData";
import * as Study from "../../lib/study";
import StudyOverview from "./StudyOverview";
import PresentedCard from "./PresentedCard";

interface IStudySectionProps {
    set: IFlashCardSet;
    studyData: ISetStudyData;
    resetSessionStudyData: () => void;
}

interface IStudySectionState {
    studyDeck?: string[];
    currentCardId?: string;
}

export default class StudySection extends React.Component<IStudySectionProps, IStudySectionState> {
    // TODO: Make these parameters variable
    private StudyMaxNewCards: number = 20;
    private StudyMaxTotalCards: number = 40;

    constructor(props: IStudySectionProps) {
        super(props);
        this.state = { };
    }

    public render() {
        if (this.state.currentCardId === undefined) {
            return <div className="container">
                <StudyOverview set={this.props.set}
                    studyData={this.props.studyData}
                    maxNewCards={this.StudyMaxNewCards}
                    maxTotalCards={this.StudyMaxTotalCards}
                    startStudy={this.startStudy.bind(this)}/>
            </div>;
        } else {
            let card = this.props.set.cards[this.state.currentCardId];
            return <PresentedCard showBack={false} card={card}/>;
        }
    }

    private startStudy(deck: string[]) {
        const currentCardId = deck.pop();
        this.setState({
            studyDeck: deck,
            currentCardId,
        });
        // Make sure no temporary data is left from previous study session
        this.props.resetSessionStudyData();
    }
}
