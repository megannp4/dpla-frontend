const fs = require('fs').promises;
const fetch = require('node-fetch');
const config = require('../cypress.json');
const baseUrl = config.baseUrl;

const PSS_BASE_URL = process.env.PSS_BASE_URL || 'https://dp.la/pssapi';
const WORDPRESS_URL = process.env.WORDPRESS_URL || 'https://dpla.wpengine.com';
const API_ENDPOINT_ALL_TOPICS = `${WORDPRESS_URL}/wp-json/dpla/v2/categories`;
const API_ENDPOINT_SUBTOPICS_FOR_TOPIC = `${WORDPRESS_URL}/wp-json/dpla/v2/subcategories`;

const extractSourceSetSlug = (url) => /\/primary-source-sets\/sets\/([-\w]*)/.exec(url)[1];

const loadJson = async (url) => {
    const response = await fetch(url);
    return await response.json(API_ENDPOINT_ALL_TOPICS);
}

const loadTopics = async () => {
    let result = [];
    const topicsJson = await loadJson(API_ENDPOINT_ALL_TOPICS);
    for (const topic of topicsJson) {
        const slug = topic['slug'];
        const subtopics =
            await loadJson(`${API_ENDPOINT_SUBTOPICS_FOR_TOPIC}?parent=${topic['term_id']}`);
        const subtopicSlugs = subtopics.map( (subtopic) => subtopic.slug );
        result.push( { slug: slug, subtopics: subtopicSlugs } );
    }
    return result;
}

const loadSets = async () => {
    const setsJson = await loadJson(`${PSS_BASE_URL}/sets.json`);
    return setsJson['itemListElement'].map( (set) => extractSourceSetSlug(set['@id']))
}

const loadExhibits = async () => {
    let result = [];
    const exhibitsJson = await loadJson(`${baseUrl}/api/exhibitions`);
    for (const exhibit of exhibitsJson) {
        const pageData = await loadJson(`${baseUrl}/api/exhibition_pages?exhibit=${exhibit.id}`)
        const pageSlugs = pageData.map( (page) => page.slug)
        result.push( { slug: exhibit.slug, pages: pageSlugs} );
    }
    return result;
}

const writeFile = async (path, data) =>
    await fs.writeFile(path, JSON.stringify(data), {})

const main = async () => {
    console.log("Loading sets.");
    const sets = await loadSets();
    await writeFile('cypress/fixtures/sets.json', sets);

    console.log("Loading exhibitions.");
    const exhibits = await loadExhibits();
    await writeFile('cypress/fixtures/exhibitions.json', exhibits);

    console.log("Loading topics.");
    const topics = await loadTopics();
    await writeFile('cypress/fixtures/topics.json', topics);
}

if (require.main === module) {

    process.on("uncaughtException", err => {
        console.error("Uncaught Exception: ", err.stack);
        process.exit(1);
    });

    console.log("Generating fixtures.");
    main().then( () => console.log("Finished.") );
}