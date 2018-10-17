import * as React from "react";
import { connect } from "react-redux";
import { Dispatch } from "redux";
import IFlashCardSet, { IFlashCardSetCardFilter } from "../../lib/flashcard/FlashCardSet";
import IRemote from "../../lib/remote";
import IStorageProvider, { Storage } from "../../lib/storage/StorageProvider";
import * as Utils from "../../lib/utils";
import { IAppState } from "../../reducers";
import { CardDivider } from "./CardDivider";
import CardEditor from "./CardEditor";
import { TagFilter } from "./TagFilter";

interface ISetCardEditorOwnProps {
    setId: string;
}

interface ISetCardEditorStateProps extends ISetCardEditorOwnProps {
    set: IFlashCardSet;
}

interface ISetCardEditorDispatchProps {
    addNewCard: (afterCardId?: string) => string;
    loadCards: (cardIds: string[]) => void;
    filterCards: (filter: IFlashCardSetCardFilter) => void;
}

interface ISetCardEditorProps extends ISetCardEditorStateProps, ISetCardEditorDispatchProps { }

interface ISetCardEditorState {
    shownCards: { [cardId: string]: boolean };
}

class SetCardEditor extends React.Component<ISetCardEditorProps, ISetCardEditorState> {
    /**
     * How many cards to load every time more cards are loaded
     */
    private cardsToLoadAtOnce = 10;
    /**
     * The number of pixels from the bottom of the screen until more cards are loaded
     */
    private loadNextCardsAt = 1500;
    private scrollListener = this.onScroll.bind(this);

    /**
     * Indicates whether the current render is the first one taking place
     * Used to prevent card animations when they are first added in
     */
    private newlyAddedCards: {[id: string]: boolean} = {};

    constructor(props: ISetCardEditorProps) {
        super(props);
        const set = this.props.set;
        if (set.filteredCardOrder.value === undefined) {
            throw new Error("Filtered card order should never be undefined");
        }

        // Set initial state
        const initialShownCards = set.filteredCardOrder.value.slice(0, this.cardsToLoadAtOnce);
        this.state = {
            shownCards: Utils.arrayToObject(initialShownCards, cardId => [cardId, true]),
        };

        // Load the cards to be edited
        props.loadCards(initialShownCards);
    }

    public render() {
        const set = this.props.set;
        const content = <div className="container card-editor">
            { /* Set name */ }
            <h2 className="title is-4">Edit cards in {set.name}</h2>
            <h3 className="subtitle is-6">{set.cardOrder.length === 0
                ? "This set contains no cards."
                : "Showing " + set.filteredCardOrder.value!.length + " cards out of "
                    + set.cardOrder.length }</h3>

            <TagFilter tags={set.availableTags}
                activeTags={set.filter.tags || { }}
                toggleTag={this.toggleTag.bind(this)} />

            { /* Button for adding new card to the set. Dummy button is shown if filter is updating */ }
            <CardDivider
                isSubtle={set.filteredCardOrder.value!.length !== 0}
                addCard={! set.filteredCardOrder.isFetching ? this.addNewCard.bind(this) : undefined}
            />

            { /* Set content */ }
            {this.renderCards()}
        </div>;

        return content;
    }

    public componentWillMount() {
        window.addEventListener("scroll", this.scrollListener);
    }

    public componentWillUnmount() {
        window.removeEventListener("scroll", this.scrollListener);
    }

    private renderCards() {
        const set = this.props.set;
        const cards: JSX.Element[] = [];
        if (set.filteredCardOrder.isFetching || set.filteredCardOrder.value === undefined) {
            // If currently filtering cards, show two placeholders
            for (let i = 0; i < 2; i++) {
                cards.push(
                    <CardEditor key={i}
                                setId={this.props.setId}
                                cardId={"PLACEHOLDER"}
                                slideIn={false}
                                addNewCard={this.addNewCard.bind(this)}
                                onDeleted={this.cardDeleted.bind(this)} />,
                );
            }
        } else if (set.filteredCardOrder.value.length === 0) {
            // No cards match the filter
        } else {
            // This deck contains cards and they should be rendered
            let loadingCards: number = 0;
            let shownCards: number = 0;
            for (const cardId of this.props.set.filteredCardOrder.value!) {
                if (shownCards === Object.keys(this.state.shownCards).length) {
                    // All the cards have been shown. No need to go through the rest
                    break;
                }
                if (this.state.shownCards[cardId] !== true) { continue; }

                const card = set.cards[cardId];
                if (card === undefined) {
                    continue;
                }

                // Never show more than two cards loading at once
                if (card.isFetching) {
                    loadingCards++;
                    if (loadingCards > 2) {
                        continue;
                    }
                }
                // Add the actual card editor
                cards.push(
                    <CardEditor key={cardId}
                                setId={this.props.setId}
                                cardId={cardId}
                                slideIn={this.newlyAddedCards[cardId] === true}
                                addNewCard={this.addNewCard.bind(this)}
                                onDeleted={this.cardDeleted.bind(this)}/>,
                );
                shownCards++;

                // Make sure the card doesn't show a slide transition in the future
                delete this.newlyAddedCards[cardId];
            }
        }

        return <ul>
            { cards }
        </ul>;
    }

    private onScroll() {
        const scrollPos = window.scrollY;
        const docHeight = document.body.scrollHeight;
        const screenHeight = window.innerHeight;

        if (docHeight - (scrollPos + screenHeight) < this.loadNextCardsAt) {
            this.loadMoreCards(this.cardsToLoadAtOnce);
        }
    }

    private addNewCard(afterCardId?: string) {
        const newCardId = this.props.addNewCard(afterCardId);
        // The newly added card will always be shown
        this.setState({ shownCards: {
            ...this.state.shownCards,
            [newCardId]: true,
        }});
        this.newlyAddedCards[newCardId] = true;
    }

    private cardDeleted(cardId: string) {
        const {[cardId]: deletedCard, ...rest} = this.state.shownCards;
        this.setState({ shownCards: rest });
        // Run the scroll listener in case more cards need to be loaded
        this.onScroll();
    }

    /**
     * Loads more cards
     */
    private loadMoreCards(count: number) {
        const set = this.props.set;
        const loadingCards = Object.keys(this.state.shownCards)
                                .filter(c => set.cards[c] !== undefined
                                          && set.cards[c].isFetching === true);
        // Only load more cards if the cards from the last loading have actually been loaded
        if (loadingCards.length < this.cardsToLoadAtOnce) {
            let addedCards: number = 0;
            const cardsToLoad: string[] = [];
            for (const cardId of set.filteredCardOrder.value!) {
                // Only add the specified amount of cards
                if (addedCards === count) { break; }

                if (this.state.shownCards[cardId] !== true) {
                    cardsToLoad.push(cardId);
                    addedCards++;
                }
            }

            if (cardsToLoad.length === 0) {
                return;
            }
            this.props.loadCards(cardsToLoad);
            this.setState({ shownCards: {
                    ...this.state.shownCards,
                    ...Utils.arrayToObject(cardsToLoad, cardId => [cardId, true]),
                },
            });
        }
    }

    private toggleTag(tag: string) {
        const set = this.props.set;
        let newTags: { [tag: string]: boolean };
        if (set.filter.tags[tag] === true) {
            // Create a new object where this tag is not present
            const { [tag]: removedTagValue, ...tagsWithTagRemoved} = set.filter.tags;
            newTags = tagsWithTagRemoved;
        } else {
            newTags = {...set.filter.tags, [tag]: true };
        }

        this.props.filterCards({
            ...set.filter,
            tags: newTags,
        });
    }
}

function mapStateToProps(state: IAppState, ownProps: ISetCardEditorOwnProps): ISetCardEditorStateProps {
    return {
        ...ownProps,
        set: state.sets.value![ownProps.setId].value!,
    };
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: ISetCardEditorOwnProps): ISetCardEditorDispatchProps {
    return {
        addNewCard: (afterCardId?: string) =>
            dispatch<any>(Storage.addCard(ownProps.setId, afterCardId)),
        loadCards: (cardIds: string[]) =>
            dispatch<any>(Storage.loadCards(ownProps.setId, cardIds)),
        filterCards: (filter: IFlashCardSetCardFilter) =>
            dispatch<any>(Storage.filterCards(ownProps.setId, filter)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(SetCardEditor);
