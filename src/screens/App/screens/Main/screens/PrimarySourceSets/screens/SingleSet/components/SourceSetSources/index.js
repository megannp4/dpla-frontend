import React from "react";

import { Link } from "react-router-dom";

import styles from "./SourceSetSources.css";
import { module } from "../../../../../../../../css/utils.css";
import mockSources from "../../mockSources";

const SourceSetSources = ({ match, location }) =>
  <div className={styles.wrapper}>
    <div className={[styles.sourceSetSources, module].join(" ")}>
      {mockSources.map(({ title, img, id }) =>
        <Link
          to={{
            pathname: `${match.url}/sources/${id}`,
            search: location.search
          }}
          className={styles.set}
        >
          <div className={styles.imageWrapper}>
            <img alt={title} src={img} className={styles.image} />
          </div>
          <p className={styles.title}>{title}</p>
        </Link>
      )}
    </div>
  </div>;

export default SourceSetSources;