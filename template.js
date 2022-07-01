const getEventData = require('getEventData');
const getCookieValues = require('getCookieValues');
const setCookie = require('setCookie');
const parseUrl = require('parseUrl');

const parsedUrl = parseUrl(data.urlSource === 'page_location_default' ? getEventData('page_location') : data.urlSource);

if (!parsedUrl) {
    data.gtmOnFailure();

    return;
}

let channelFlow = getChannelFlow();

if (!channelFlow) {
    data.gtmOnFailure();

    return;
}

const cookieOptions = {
    domain: 'auto',
    path: '/',
    samesite: 'Lax',
    secure: true,
    httpOnly: false
};

if (data.cookieTime > 0) cookieOptions['max-age'] = data.cookieTime;

setCookie('channel_flow', channelFlow, cookieOptions, true);
setCookie('channel_flow_first', getFirstChannelFromChannelFlow(channelFlow), cookieOptions, true);
setCookie('channel_flow_last', getLastChannelFromChannelFlow(channelFlow), cookieOptions, true);

data.gtmOnSuccess();


function getChannelFlow() {
    const channelFlowCookie = getCookieValues('channel_flow')[0];
    const currentChannel = getCurrentChannel();

    if (!channelFlowCookie) {
        return currentChannel;
    }

    if (currentChannel === 'direct/none') {
        return channelFlowCookie;
    }

    const channelFlowLastCookie = getCookieValues('channel_flow_last')[0];

    if (currentChannel === channelFlowLastCookie) {
        return channelFlowCookie;
    }

    return channelFlowCookie + ',' + currentChannel;
}

function getCurrentChannel() {
    const utmSource = parsedUrl.searchParams.utm_source;
    const utmMedium = parsedUrl.searchParams.utm_medium;
    
    //Google Ads : gclid, gclsrc, wbraid and gbraid
    const googleAdsgclid = parsedUrl.searchParams.gclid;
    const googleAdsgclsrc = parsedUrl.searchParams.gclsrc;
    const googleAdswbraid = parsedUrl.searchParams.wbraid;
    const googleAdsgbraid = parsedUrl.searchParams.gbraid;
    
    //Google DoubleClick : dclid
    const googleDoubleClickdclid = parsedUrl.searchParams.dclid;
      
    //Bing Ads : msclkid
    const bingAdsmsclkid = parsedUrl.searchParams.msclkid;
    
    //Facebook : fbclid
    const facebookIdentifierfbclid = parsedUrl.searchParams.fbclid;

    if (googleAdsgclid || googleAdsgclsrc || googleAdswbraid || googleAdsgbraid || googleDoubleClickdclid || bingAdsmsclkid) {
        return (bingAdsmsclkid ? 'bing' : 'google') + '/' + ('paid');
    }
    
    if (facebookIdentifierfbclid) {
        return ('facebook') + '/' + ('paid');
    }
    
    if (utmSource || utmMedium) {
        return (utmSource ? utmSource : 'direct') + '/' + (utmMedium ? utmMedium : 'none');
    }

    const parsedReferrer = parseUrl(data.referrerSource === 'page_referrer_default' ? getEventData('page_referrer') : data.referrerSource);

    if (!parsedReferrer) {
        return 'direct/none';
    }

    const referrerHostname = parsedReferrer.hostname;

    if (referrerHostname === parsedUrl.hostname) {
        return 'direct/none';
    }

    if (referrerHostname && referrerHostname.match(data.searchEngineExpression)) {
        const referrerHostnameParts = referrerHostname.replace('www.', '').split('.');
        return referrerHostnameParts[0] + '/organic';
    }

    return referrerHostname + '/referral';
}

function getLastChannelFromChannelFlow(channelFlow) {
    let channels = channelFlow.split(',');

    return channels[channels.length - 1];
}

function getFirstChannelFromChannelFlow(channelFlow) {
    let channels = channelFlow.split(',');

    return channels[0];
}
