import * as React from "react";
import IFlashCard from "../../lib/flashcard/flashcard";
import { IFlashCardFace } from "../../lib/flashcard/FlashCardFace";
import IFlashCardSet from "../../lib/flashcard/FlashCardSet";
import CardEditor from "./CardEditor";

interface ISetCardEditorProps {
    onChange?: (newSet: IFlashCardSet) => void;
    addNewCard: (setId: string) => void;
    deleteCard: (card: IFlashCard) => void;
    updateCardFace: (cardId: string, face: IFlashCardFace) => void;
    set: IFlashCardSet;
}

export default class SetCardEditor extends React.Component<ISetCardEditorProps> {
    constructor(props: ISetCardEditorProps) {
        super(props);
        // Set initial state
        this.state = {
            cardBeingEdited: undefined,
        };
    }

    public render() {
        return <div className="container">
            { /* Set name */ }
            <h2 className="title is-3">Cards in {this.props.set.name}</h2>
            <h3 className="subtitle is-4">{this.cardCount === 0
                ? "This set contains no cards."
                : "This set contains " + this.cardCount + " card" + (this.cardCount === 1 ? "" : "s") + "." }</h3>

            { /* Set content */ }
            {this.renderCards()}

            { /* Button for adding new card to the set*/ }
            <a className="button is-primary" onClick={this.addNewCard.bind(this)}>Add new card</a>
        </div>;
    }

    private addNewCard() {
        this.props.addNewCard(this.props.set.id);
    }

    private get cardCount(): number {
        return Object.keys(this.props.set.cards).length;
    }

    private renderCards() {
        if (this.cardCount === 0) {
            // In case no cards currently exist
        } else {
            // This deck contains cards and they should be rendered
            const cards: JSX.Element[] = [];
            for (const id of Object.keys(this.props.set.cards)) {
                const card = this.props.set.cards[id];
                cards.push(<CardEditor key={id} card={card}
                    deleteCard={this.props.deleteCard} updateCardFace={this.props.updateCardFace}/>);
            }
            return <div>
                <div className="columns">
                    <div className="column">
                        <h4 className="title is-4">Front</h4>
                    </div>
                    <div className="column">
                        <h4 className="title is-4">Back</h4>
                    </div>
                </div>
                <ul>
                    {cards}
                </ul>
            </div>;
        }
    }
}
