import React from "react";
import fetch from "isomorphic-fetch";

import MainLayout from "components/MainLayout";
import ContentPagesSidebar from "components/shared/ContentPagesSidebar";
import { classNames, stylesheet } from "css/pages/search-tips.css";
import {
  SEARCH_TIPS_ENDPOINT,
  CONTENT_PAGE_NAMES
} from "constants/content-pages";
import { classNames as utilClassNames } from "css/utils.css";

const SearchTips = ({ url, searchTips }) =>
  <MainLayout route={url}>
    <div>
      <div
        className={[
          utilClassNames.module,
          classNames.sidebarAndContentWrapper
        ].join(" ")}
      >
        <ContentPagesSidebar page={CONTENT_PAGE_NAMES.SEARCH_TIPS} />
        <div className={classNames.content}>
          <div
            dangerouslySetInnerHTML={{ __html: searchTips.content.rendered }}
          />
        </div>
      </div>
    </div>
    <style dangerouslySetInnerHTML={{ __html: stylesheet }} />
  </MainLayout>;

SearchTips.getInitialProps = async () => {
  const res = await fetch(SEARCH_TIPS_ENDPOINT);
  const json = await res.json();

  return { searchTips: json };
};

export default SearchTips;