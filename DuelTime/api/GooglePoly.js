import ExpoTHREE from 'expo-three';
import AssetUtils from 'expo-asset-utils';
import * as THREE from 'three';
require("./../util/OBJLoader");
require("./../util/MTLLoader");

export default class GooglePoly {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.currentResults = [];
        this.nextPageToken = "";
        this.keywords = "";
    }

    static getQueryURL(apiKey, keywords, nextPageToken) {
        //https://poly.googleapis.com/v1/assets?keywords=duck&pageSize=5&key={YOUR_API_KEY}

        const baseURL = "https://poly.googleapis.com/v1/assets";
        const pageSize = 10;
        const maxComplexity = "MEDIUM";
        const format = "OBJ"

        var url = ""
            + baseURL + "?"
            + "key=" + apiKey
            + "&pageSize=" + pageSize
            + "&maxComplexity=" + maxComplexity
            + "&format=" + format
            + (keywords && keywords != "" ? "&keywords=" + encodeURIComponent(keywords) : "")
            + (nextPageToken ? "&pageToken=" + nextPageToken : "")
            ;
        return url;
    }

    setSearchParams = (keywords) => {
        this.currentResults = [];
        this.nextPageToken = "";
        this.keywords = keywords;
    }

    getResearchResults() {
        const url = GooglePoly.getQueryURL(this.apiKey, this.keywords, this.nextPageToken);
        return fetch(url)
            .then((response) => {
                return response.json();
            })
            .then(function (data) {
                this.currentResults = this.currentResults.concat(data.assets);
                this.nextPageToken = data.nextPageToken;

                return Promise.resolve(data.assets);
            }.bind(this));
    }
}