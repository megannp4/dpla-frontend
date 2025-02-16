import bottomnav from "../../fixtures/bottomnav.json";


// NOTE: This currently skips the /search link in the footer because it's too expensive
// to run search over everything the way it's currently implemented.

describe('The bottom nav', () => {

    beforeEach(() => {
        cy.visit('/')
    });

    it(`hasn't changed on /`, () => {
        const globalHeader = cy.getDataCy('footer');
        globalHeader.should('be.visible')
        globalHeader.toMatchSnapshot();

    });
    ['DPLA', 'Tools'].forEach((section) => {
        bottomnav[section].forEach((destPage) => {
            it(`on /, ${destPage.selector} navigates to ${destPage.path}`, () => {
                cy.getDataCy('footer').within(() => {
                    cy.getDataCy(destPage.selector).click();
                    cy.checkTitle(destPage.title);
                });
            });
        });
    });

    // The pro site stuff navigates off site, so we're just testing that the links
    // have the correct href
    bottomnav['DPLA Pro'].forEach((destPage) => {
        it(`on /, ${destPage.selector} links to ${destPage.url}`, () => {
            cy.getDataCy('footer').within(() => {
                cy.getDataCy(destPage.selector).should('have.attr', 'href', destPage.url);
            });
        })
    })
})

