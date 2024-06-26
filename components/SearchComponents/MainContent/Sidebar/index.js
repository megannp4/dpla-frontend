import React from "react";
import Link from "next/link";
import Router, { withRouter } from "next/router";


import Button from "shared/Button";
import Accordion from "components/shared/Accordion";
const informationIcon = "/static/images/information.svg";

import {
  possibleFacets,
  qaFacets,
  mapFacetsToURLPrettified,
  prettifiedFacetMap,
    tooltips
} from "constants/search";
import { SITE_ENV } from "constants/env";
import { addCommasToNumber, escapeForRegex, removeQueryParams } from "lib";

import css from "./Sidebar.module.scss";
import Tooltip from "@material-ui/core/Tooltip";

const FacetLink = withRouter(({router, queryKey, termObject, disabled, isTooltip}) => {
    if (disabled) {
        return (<span className={css.facet}>
            <span className={`${css.facetName} ${css.activeFacetName}`}>
                 {`${termObject.term} `}
            </span>
            <span className={css.facetCount}>
                {addCommasToNumber(termObject.count)}
            </span>
        </span>);
    }

    const href = {
        pathname: router.pathname,
        query: Object.assign({}, router.query, {
            // some facet names have spaces, and we need to wrap them in " "
            [queryKey]: router.query[queryKey]
                ? [`${router.query[queryKey]}`, `"${[termObject.term]}"`].join("|")
                : `"${termObject.term}"`,
            page: 1
        })
    };

    return (<div className={css.facet}>
            <span className={css.facetName}><Link
                href={href}
            ><a className={css.facetLink}>{termObject.term}</a></Link>{(isTooltip && tooltips[termObject.term] != null) &&
            (<Link href={tooltips[termObject.term].link}>
                    <a className={css.toolTip}>
                        <Tooltip
                            title={tooltips[termObject.term].text}
                            placement="top"
                        >
                            <img
                                src={informationIcon}
                                alt=""
                                className={css.informationIcon}
                            />
                        </Tooltip>
                    </a>
                </Link>)
            }</span>{" "}<Link href={href}>
                <a className={css.facetCount}>{addCommasToNumber(termObject.count)}</a>
            </Link>
        </div>);
});

class DateFacet extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            after: this.props.after || "",
            before: this.props.before || ""
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (
            this.props.after !== prevProps.after ||
            this.props.before !== prevProps.before
        ) {
            this.setState({
                after: this.props.after || "",
                before: this.props.before || ""
            });
        }
    }

    cleanText(target, compare) {
        let year = target.value;
        if (isNaN(target.value)) {
            year = compare;
            target.value = year;
        }
        return year;
    }

    handleAfterText = event => {
        let year = this.cleanText(event.target, this.state.after);
        this.setState({
            before: this.state.before,
            after: year
        });
    };

    validateAfter = event => {
        let year = this.cleanText(event.target, this.state.after);
        if (year !== "" && this.state.before !== "" && year > this.state.before) {
            year = this.state.before;
            this.setState({
                before: this.state.before,
                after: year
            });
        }
    };

    handleBeforeText = event => {
        let year = this.cleanText(event.target, this.state.before);
        this.setState({
            after: this.state.after,
            before: year
        });
    };

    validateBefore = event => {
        let year = this.cleanText(event.target, this.state.before);
        if (year !== "" && this.state.after !== "" && year < this.state.after) {
            year = this.state.after;
            this.setState({
                after: this.state.after,
                before: year
            });
        }
    };

    handleKeyDown(e) {
        if (e.keyCode === 13) {
            this.handleDateSubmit(e);
        }
    }

    handleDateSubmit(e) {
        e.preventDefault();
        const dateProps = this.getDateProps();
        Router.push({
            pathname: this.props.router.pathname,
            query: Object.assign(
                {},
                removeQueryParams(this.props.router.query, ["after", "before"]),
                dateProps,
                {
                    page: 1
                }
            )
        });
    }

    getDateProps() {
        let dateProps = {};
        if (this.state.after !== "") dateProps.after = this.state.after;
        if (this.state.before !== "") dateProps.before = this.state.before;
        return dateProps;
    }

    render() {
        // NOTE: this form should maybe be wrapping the entire sidebar?
        const { router } = this.props;
        const formVals = Object.assign(
            {},
            removeQueryParams(router.query, ["after", "before", "page"]),
            {
                page: 1
            }
        );
        return (
            <form
                action={router.pathname}
                method="get"
                className={css.dateRangeFacet}
                onSubmit={e => this.handleDateSubmit(e)}
            >
                <label className={css.dateFacet} htmlFor="after-date">
                    <span>Between Year</span>
                    <input
                        id="after-date"
                        type="numeric"
                        name="after"
                        value={this.state.after}
                        onChange={e => this.handleAfterText(e)}
                        onBlur={e => this.validateAfter(e)}
                        onKeyDown={e => this.handleKeyDown(e)}
                    />
                </label>
                <label className={css.dateFacet} htmlFor="before-date">
                    <span>and Year</span>
                    <input
                        id="before-date"
                        type="numeric"
                        name="before"
                        value={this.state.before}
                        onChange={e => this.handleBeforeText(e)}
                        onBlur={e => this.validateBefore(e)}
                        onKeyDown={e => this.handleKeyDown(e)}
                    />
                </label>
                {Object.entries(formVals).map(([k, v], index) => {
                    return <input type="hidden" name={k} key={index} value={v}/>;
                })}
                <Button type="secondary" className={css.dateButton} mustSubmit={true}>
                    Update
                </Button>
            </form>
        );
    }
}

class Sidebar extends React.Component {

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (
            possibleFacets.some(
                facet => this.props.facets[facet] !== prevProps.facets[facet]
            ) ||
            prevProps.query !== this.props.query
        ) {
            this.forceUpdate();
        }
    }

    render() {
        const { router, facets } = this.props;
        const isFacetValueInQuery = (facetKey, value) =>
            router.query[mapFacetsToURLPrettified[facetKey]] &&
            // handles case of sources with both
            // "moving image" and "image" as types
            new RegExp('"' + escapeForRegex(value) + '"').test(
                router.query[mapFacetsToURLPrettified[facetKey]]
            );
        let hasDates = false;
        return (
            <div className={css.sidebar}>
                <h2>Refine your search</h2>
                <Accordion
                    items={Object.keys(facets).map((key, i) => {
                        if (SITE_ENV === "local" && key.indexOf("provider.name") !== -1)
                            return "";
                        if (key.indexOf("sourceResource.date") === -1 && key.indexOf("tags") === -1) {
                            return {
                                name: prettifiedFacetMap[key],
                                // first two items should be expanded as well as any items
                                // with an active subitem found in the query string
                                active:
                                    i < 2 ||
                                    facets[key].terms.some(termObject =>
                                        isFacetValueInQuery(key, termObject.term)
                                    ),
                                type: "term",
                                subitems: facets[key].terms.map(termObject => {
                                    return {
                                        content: qaFacets.includes(key)
                                            ? <FacetLink
                                                termObject={termObject}
                                                queryKey={mapFacetsToURLPrettified[key]}
                                                disabled={isFacetValueInQuery(key, termObject.term)}
                                                isTooltip={key === "rightsCategory"}
                                            />
                                            : ""
                                    };
                                })
                            };
                        } else {
                            if (!hasDates) {
                                hasDates = true; // because there's facets for after and before we dont want two date ranges
                                let dateProps = {};
                                if (router.query.after) dateProps.after = router.query.after;
                                if (router.query.before) dateProps.before = router.query.before;
                                return {
                                    name: prettifiedFacetMap[key],
                                    active: true,
                                    type: "date",
                                    subitems: <DateFacet router={router} {...dateProps} />
                                };
                            } else {
                                return "";
                            }
                        }
                    })}
                />
            </div>
        );
    }
}

export default withRouter(Sidebar);