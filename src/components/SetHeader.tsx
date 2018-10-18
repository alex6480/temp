import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Dispatch } from "redux";
import IFlashCardSet, { IFlashCardSetMeta } from "../lib/flashcard/FlashCardSet";
import IRemote from "../lib/remote";
import { Storage } from "../lib/storage/StorageProvider";
import EditableText from "./rich-text-editor/EditableText";

interface ISetHeaderOwnProps {
    setId: string;
    set: IRemote<IFlashCardSet>;
}

interface ISetHeaderDispatchProps {
    saveSetMeta: (setMeta: Partial<IFlashCardSetMeta>) => void;
}

interface ISetHeaderProps extends ISetHeaderOwnProps, ISetHeaderDispatchProps { }

class SetHeader extends React.Component<ISetHeaderProps> {
    public render() {
        return <section className="hero is-primary">
            <div className="hero-body">
                <div className="container">
                    <h1 className="title is-1">
                        {this.renderTitle()}
                    </h1>
                    <nav className="breadcrumb subtitle is-6" aria-label="breadcrumbs">
                        <ul>
                            {this.renderBreadcrumbs()}
                        </ul>
                    </nav>
                </div>
            </div>
        </section>;
    }

    private renderTitle() {
        if (this.props.set.value === undefined) {
            // No data is available at all. Just show an empty header
            return <>&nbsp;</>;
        } else if (this.props.set.isFetching) {
            // Show a readonly header with a loading icon
            return <>
                <span className="icon is-large">
                    <i className=" fas fa-spinner fa-pulse "></i>
                </span>
                <EditableText maxLength={30}
                    readOnly={true}
                    value={this.props.set.value.name} />
            </>;
        } else {
            // Show a normal editable text
            return <EditableText maxLength={30}
                readOnly={false}
                value={this.props.set.value.name}
                onBlur={this.updateSetName.bind(this)}/>;
        }
    }

    private renderBreadcrumbs() {
        if (this.props.set.value === undefined) {
            // Show empty breadcrumbs
            return <li>&nbsp;</li>;
        } else {
            // Show the current set in the breadcrumbs
            return <>
                <li><Link to="/">My Sets</Link></li>
                <li className="is-active"><a href="#" aria-current="page">
                    {this.props.set.value.name}
                </a></li>
            </>;
        }
    }

    private updateSetName(newName: string) {
        if (newName !== this.props.set.value!.name) {
            this.props.saveSetMeta({ id: this.props.setId, name: newName });
        }
    }
}

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        saveSetMeta: (setMeta: Partial<IFlashCardSetMeta>) => dispatch<any>(Storage.saveSetMeta(setMeta)),
    };
}

export default connect(() => ({ }), mapDispatchToProps)(SetHeader);

