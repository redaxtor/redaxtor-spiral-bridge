"use strict";

var Redaxtor = require('./submodules/redaxtor/src/index');
var RedaxtorDefaultApi = require('./submodules/redaxtor/src/Redaxtor').defaultMinimumApi;
var RedaxtorMedium = require('./submodules/redaxtor-medium/src/index');
var RedaxtorCodemirror = require('./submodules/redaxtor-codemirror/src/index');
var RedaxtorSeo = require('./submodules/redaxtor-seo/src/index');

require('./submodules/redaxtor/src/styles/redaxtor.less');
require('./medium-editor.less');
require('./submodules/redaxtor-medium/src/redaxtor-medium.less');
require('./submodules/redaxtor-seo/src/google-preview.less');

require('./node_modules/codemirror/lib/codemirror.css');
require('./spiral-specific.css');

var components = {
    html: RedaxtorMedium.HTMLEditor,
    image: RedaxtorMedium.IMGTagEditor,
    background: RedaxtorMedium.BackgroundImageEditor,
    source: RedaxtorCodemirror,
    seo: RedaxtorSeo
};

/**
 * Redaxtor bundle specific for SpiralScout
 */
class RedaxtorBundle extends Redaxtor {
    /**
     * Attaches invisible div handling SEO editing
     * @param {Object} data
     */
    attachSeo(data) {
        setTimeout(() => {
            let div = document.createElement('div');
            div.innerHTML = "Edit SEO Meta";
            div.className = "edit-seo-div";
            this.addPiece(div, {
                id: "seo",
                name: "Edit SEO",
                type: "seo",
                data: {
                    html: (data && data.html)
                    || "",
                    title: (data && data.title)
                    || (document.querySelector('title') && document.querySelector('title').innerHTML)
                    || "",
                    description: (data && data.description)
                    || (document.querySelector('meta[name="description"]') && document.querySelector('meta[name="description"]').getAttribute("content"))
                    || "",
                    keywords: (data && data.keywords)
                    || (document.querySelector('meta[name="keywords"]') && document.querySelector('meta[name="keywords"]').getAttribute("content"))
                    || ""
                }
            });
            document.querySelector('body').appendChild(div);
        });
    };

    /**
     * Constructor
     * @param {RedaxtorOptions} options
     */
    constructor(options) {
        options.pieces.components = components;
        options.pieceNameGroupSeparator = ':';
        RedaxtorBundle.checkHtmlPiecesCompartibility(document);
        super(options);

        if (options.editorActive == undefined || options.editorActive == null) {
            this.setEditorActive(RedaxtorBundle.getCookie('r_editorActive') == 'true');
        }
        if (options.navBarCollapsed == undefined || options.navBarCollapsed == null) {
            this.setNavBarCollapsed(RedaxtorBundle.getCookie('r_navBarCollapsed') == 'true');
        }

        this.onUnload = this.beforeUnload.bind(this);
        window.addEventListener("beforeunload", this.onUnload);
    }

    /**
     * beforeUnload listner
     * @param {*} event
     */
    beforeUnload(event) {
        RedaxtorBundle.setCookie('r_editorActive', this.isEditorActive());
        RedaxtorBundle.setCookie('r_navBarCollapsed', this.isNavBarCollapsed());
    }

    /**
     * Set cookies
     * @param {string} name
     * @param {*} value
     */
    static setCookie(name, value) {
        let options = {};

        value = encodeURIComponent(value);

        let updatedCookie = name + "=" + value;

        for(let propName in options) {
            if(options.hasOwnProperty(propName)) {
                updatedCookie += "; " + propName;
                let propValue = options[propName];
                if (propValue !== true) {
                    updatedCookie += "=" + propValue;
                }
            }
        }

        document.cookie = updatedCookie;
    }

    /**
     * Gets a document cookies
     * @param {string} name
     * @return {*}
     */
    static getCookie(name) {
        var matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    /**
     * Scans html pieces for invalid internal html and reverts them to source editor if needed
     * @param {HTMLElement} node
     */
    static checkHtmlPiecesCompartibility(node) {
        /**
         * In Spiral html pieces are marked up as data-piece="html", collect them
         */
        let pieces = node.querySelectorAll('[data-piece="html"]');
        for (let i = 0; i < pieces.length; i++) {
            let piece = pieces[i];
            if (piece.querySelector('iframe')) {
                // We have invalid piece data, fallback to source
                piece.setAttribute("data-piece", "source");
            }
            if (piece.querySelector('script')) {
                // Script is not expected to be editable at the moment
                piece.setAttribute("data-piece", "source");
                piece.setAttribute("data-nonupdateable", "1");
            }
        }
    }
}

RedaxtorBundle.defaultApi = RedaxtorDefaultApi;

/**
 * Starts Redaxor in window scope, starts default SpiralScout API on urls provided and attaches a seo module with custom header html
 * @param {Object} urls
 * @param {string} urls.getPieceUrl url to get piece data for dynamic pieces
 * @param {string} urls.savePieceUrl url to save piece data
 * @param {string} urls.saveMetaUrl url to save SEO piece data
 * @param {string} urls.imageGalleryUrl url to get image list
 * @param {string} urls.uploadUrl url upload images
 * @param {string} seoHtml
 */
RedaxtorBundle.startForSpiral = function (urls, seoHtml) {
    if (window.redaxtor) {
        throw new Error("Seems Redaxtor is already started");
    }

    const fetchApi = require('./fetch-api');

    let spiralApi = {
        getNodeRect: RedaxtorDefaultApi.getNodeRect,
        /**
         * Fetch RX details
         * @param {RedaxtorPiece} piece
         * @return {Promise<RedaxtorPiece>}
         */
        getPieceData: function (piece) {
            if (!piece.dataset['nonupdateable']) {
                return Redaxtor.defaultApi.getPieceData(piece);
            } else {
                return new Promise(function (resolve, reject) {
                    var data = piece.dataset;
                    data.data = piece.data;
                    fetchApi.post(urls.getPieceUrl, JSON.stringify(data)).then(
                        (resp) => {
                            resp.piece.data.updateNode = false; // Force non updates of node
                            piece.data = resp.piece.data;
                            resolve(piece);
                        }, (error) => {
                            reject(error);
                        });
                });
            }
        },
        /**
         * Save RX details
         * @param {RedaxtorPiece} piece
         * @return {Promise<RedaxtorPiece>}
         */
        savePieceData: function (piece) {
            return new Promise(function (resolve, reject) {
                var data = piece.dataset;
                data.data = piece.data;

                if (piece.type == 'seo') {
                    var metadata = piece.data;

                    // TODO: wtf is that?
                    metadata.namespace = window.metadata.namespace;
                    metadata.view = window.metadata.view;
                    metadata.code = window.metadata.code;

                    fetchApi.post(urls.saveMetaUrl, JSON.stringify(metadata)).then((d) => {
                        resolve();
                    }, (error)=> {
                        reject(error);
                    });
                } else {
                    fetchApi.post(urls.savePieceUrl, JSON.stringify(data)).then((d) => {
                        resolve();
                    }, (error)=> {
                        reject(error);
                    });
                }
            });
        },

        /**
         * Get image list
         * @return {Promise}
         */
        getImageList: function () {
            return new Promise(function (resolve, reject) {
                fetchApi.get(urls.imageGalleryUrl).then((data)=> {
                    resolve(data.map((image)=> {
                        let thumb = image.thumbnail_uri;
                        if ('' == thumb) {
                            thumb = image.uri;
                        }
                        return {
                            "url": image.compressed_uri,
                            "thumbnailUrl": thumb
                            // "width": 592,
                            // "height": 400
                        };
                    }));
                }, (error)=> {
                    reject(error);
                });
            });
        },

        /**
         * Upload image
         * @param {FormData} formData
         * @return {Promise<IRedaxtorResource>}
         */
        uploadImage: function (formData) {
            return new Promise(function (resolve, reject) {
                // formData is FormData with image field. Add rest to formData if needed and submit.
                fetchApi.postFile(urls.uploadUrl, formData).then((data)=> {
                    var thumb = data.image.thumbnail_uri;
                    if ('' == thumb) {
                        thumb = data.image.uri;
                    }
                    resolve({
                        "url": data.image.compressed_uri,
                        "thumbnailUrl": thumb
                        //  "width": 592,
                        //  "height": 400
                    });
                }, (error)=> {
                    reject(error);
                });
            });
        }
    };

    let redaxtor = new RedaxtorBundle({
        pieces: {},
        api: spiralApi
    });

    redaxtor.attachSeo({
        html: seoHtml || window.metadata.html
    });

    window.redaxtor = redaxtor;

    return redaxtor;
};

module.exports = RedaxtorBundle;
