import React from "react";

import css from "./MaxPageError.module.scss";
import utils from "stylesheets/utils.module.scss"

const MaxPageError = ({ maxPage, requestedPage }) =>
  <div className={`${utils.container} ${css.maxPageError}`}>
    Sorry, DPLA does not serve more than {maxPage} pages of results for any
    query. (You asked for results starting from {requestedPage})
  </div>;

export default MaxPageError;
