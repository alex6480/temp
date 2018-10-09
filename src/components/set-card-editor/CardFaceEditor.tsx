import { CompositeDecorator, ContentState, Editor, EditorState, RichUtils } from "draft-js";
import * as React from "react";
import "../../../node_modules/draft-js/dist/Draft.css";
import { FlashCardFaceType, IBaseFlashCardFace, IFlashCardFace } from "../../lib/flashcard/FlashCardFace";
import DropDown from "../rich-text-editor/DropDown";
import { RevealDecorator, RevealEntity } from "../rich-text-editor/RevealEntity";
import { BlockStyle, InlineStyle } from "../rich-text-editor/styles";
import { ToolbarButton, ToolbarButtonBlock, ToolbarButtonInline } from "../rich-text-editor/ToolbarButton";
import { CardFaceEditorToolbar } from "./CardFaceEditorToolbar";

type ICardFaceEditorState = IRichTextCardFaceEditorState;

interface IRichTextCardFaceEditorState {
    faceType: FlashCardFaceType;
    editorState: EditorState;
}

export interface ICardFaceEditorProps {
    face: IFlashCardFace;
    cardId: string;
    readOnly?: boolean;
    saveCardFace: (face: IFlashCardFace) => void;
    swapCardFaces: (cardId: string) => void;
}

export default class CardFaceEditor extends React.Component<ICardFaceEditorProps, ICardFaceEditorState> {
    private editor: Editor | null = null;

    constructor(props: ICardFaceEditorProps) {
        super(props);

        if (props.face.type === FlashCardFaceType.RichText) {
            const editorState = props.face.richTextContent != null
            ? EditorState.createWithContent(props.face.richTextContent, new CompositeDecorator([
                RevealDecorator,
            ]))
            : EditorState.createEmpty();

            this.state = {
                faceType: props.face.type,
                editorState,
            };
        } else {
            this.state = {
                faceType: props.face.type,
                editorState: EditorState.createEmpty(),
            };
        }
    }

    public componentWillReceiveProps(newProps: ICardFaceEditorProps) {
        if (newProps.face.type === FlashCardFaceType.RichText) {
            const editorState = newProps.face.richTextContent != null
            ? EditorState.createWithContent(newProps.face.richTextContent, new CompositeDecorator([
                RevealDecorator,
            ]))
            : EditorState.createEmpty();

            this.setState({
                faceType: newProps.face.type,
                editorState,
            });
        }
    }

    public render() {
        const toolbar = <CardFaceEditorToolbar
            editorState={this.state.editorState}
            face={this.props.face}
            swapFaces={this.swapFaces.bind(this)}
            setType={this.setType.bind(this)}
            onChange={this.onChange.bind(this)}
        />;

        let content: JSX.Element;
        switch (this.props.face.type) {
            case FlashCardFaceType.RichText:
                content = <div className="flashcard-face-content card-content content"
                            onClick={this.focusEditor.bind(this)}>
                    <Editor
                        readOnly={this.props.readOnly}
                        editorState={this.state.editorState}
                        onChange={this.onChange.bind(this)}
                        ref={editor => this.editor = editor}
                        onBlur={this.onBlur.bind(this)}
                        placeholder={this.props.face.id === "front" ? "Front" : "Back"}
                    />
                </div>;
                break;
            case FlashCardFaceType.None:
                content = <div className="flashcard-face-content no-content"></div>;
                break;
            case FlashCardFaceType.Image:
                content = <div className="flashcard-face-content image"></div>;
                break;
            default:
                throw new Error("Unknown face type");
        }

        return <>
            {toolbar}
            {content}
        </>;
    }

    private focusEditor(e: React.MouseEvent) {
        e.preventDefault();
        if (this.editor) {
            this.editor.focus();
        }
    }

    private onChange(editorState: EditorState) {
        this.setState({ editorState });
    }

    private swapFaces() {
        // this.updateGlobalState();
        // this.props.swapCardFaces(this.props.cardId);
    }

    private setType(newType: FlashCardFaceType) {
        let base: IBaseFlashCardFace;
        switch (this.props.face.type) {
            case FlashCardFaceType.RichText:
                const {richTextContent, ...baseRich} = this.props.face;
                base = baseRich;
                break;
            case FlashCardFaceType.None:
                const {...baseNone} = this.props.face;
                base = baseNone;
                break;
            case FlashCardFaceType.Image:
                const {...baseImage} = this.props.face;
                base = baseImage;
                break;
            default:
                throw new Error("Unkown face type");
        }

        switch (newType) {
            case FlashCardFaceType.None:
                this.props.saveCardFace({
                    ...base,
                    type: FlashCardFaceType.None,
                });
                break;
            case FlashCardFaceType.RichText:
                this.props.saveCardFace({
                    ...base,
                    type: FlashCardFaceType.RichText,
                    richTextContent: ContentState.createFromText(""),
                });
                break;
            case FlashCardFaceType.Image:
                this.props.saveCardFace({
                    ...base,
                    type: FlashCardFaceType.Image,
                });
        }
    }

    private onBlur() {
        this.updateGlobalState();
    }

    private updateGlobalState() {
        if (this.props.face.type === FlashCardFaceType.RichText) {
            this.props.saveCardFace({
                ...this.props.face,
                richTextContent: this.state.editorState.getCurrentContent(),
            });
        }
    }
}
