/**
 * This function detects the source of the current traffic, using the same logic as Google Analytics.
 * @param options {referrerExclusion: []}
 * @returns {{campaign: null, term: null, source: null, medium: null, content: null}}
 */
function getSourceData(options = {}) {
    const sourceData = {
        source: null,
        medium: null,
        campaign: null,
        content: null,
        term: null
    };

    // Helper functions

    function getHostnameFromUrl(url) {
        try {
            return new URL(url).hostname;
        } catch (e) {
            return null;
        }
    }

    // Prepare some data

    const urlParams = new URLSearchParams(window.location.search);
    const referrer = document.referrer;
    const referrerHostname = getHostnameFromUrl(referrer);
    options.referrerExclusion = options.referrerExclusion || [];

    // Source detection process starts here

    // Prio 1 - if Google Click ID is present, it's google/cpc traffic
    const googleClickId = urlParams.get('gclid') || urlParams.get('gbraid') || urlParams.get('wbraid');
    if (googleClickId) {
        sourceData.source = 'google';
        sourceData.medium = 'cpc';
        sourceData.campaign = urlParams.get('utm_campaign');
        sourceData.content = urlParams.get('utm_content');
        sourceData.term = urlParams.get('utm_term');
        return sourceData;
    }

    // Prio 2 - if UTM parameters are present, use them
    // utm_source is mandatory, other parameters are optional
    if(urlParams.has('utm_source')) {
        sourceData.source = urlParams.get('utm_source');
        sourceData.medium = urlParams.get('utm_medium');
        sourceData.campaign = urlParams.get('utm_campaign');
        sourceData.content = urlParams.get('utm_content');
        sourceData.term = urlParams.get('utm_term');
        return sourceData;
    }

    // Prio 3 - check for organic search engines
    if(referrerHostname) {
        const mapping = {
            // Domain part => Search engine name
            'google.': 'google',
            'bing.': 'bing',
            'yahoo.': 'yahoo',
            'duckduckgo.': 'duckduckgo',
            'yandex.': 'yandex',
            'ecosia.': 'ecosia',
            'msn.': 'msn',
            'qwant.': 'qwant'
        }

        for(const key in mapping) {
            if(referrerHostname.includes(key)) {
                sourceData.source = mapping[key];
                sourceData.medium = 'organic';
                return sourceData;
            }
        }
    }

    // Prio 4 - check for referrer traffic
    if(referrerHostname) {
        // see if any referrerExclusion matches the referrer
        if(options.referrerExclusion.some(hostnamePattern => referrerHostname.includes(hostnamePattern))) {
            // this is no valid source -> send null values
            return sourceData;
        }
        else {
            sourceData.source = referrerHostname;
            sourceData.medium = 'referral';
            return sourceData;
        }
    }

    // Otherwise it's direct traffic, all values are null
    return sourceData;
}

// Usage example

const sourceData = getSourceData({
    referrerExclusion: ['example.org', 'localhost'] // make sure to exclude all hostnames that should not be considered as a source - e.g. your own domains and payment gateways
});

console.log(sourceData);

// Beware that GA4 (contrary to UA) will only report the first source from a session
// If the user returns within a certain timespan (e.g. 30 minutes, depending on settings) since the last activity, the new source will be ignored