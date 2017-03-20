<?php if (spiral(\Spiral\Pieces\Pieces::class)->canEdit()): ?>
    <script src="/redaxtor.min.js"></script>
    <script>
        var redaxtor = new Redaxtor({
            options: {
                html: {
                    pickerColors: [
                        "inherit",
                        "#202732",
                        "#D30E5C",
                        "#F2E452",
                        "#9b59b6",
                        "#34495e",
                        "#16a085",
                        "#27ae60",
                        "#2980b9",
                        "#8e44ad",
                        "#2c3e50",
                        "#f1c40f",
                        "#e67e22",
                        "#e74c3c",
                        "#bdc3c7",
                        "#95a5a6",
                        "#666",
                        "#212121",
                        "#f39c12",
                        "#d2d064",
                        "#4fbbf7",
                        "#ffffff"
                    ]
                }
            },
            pieces: {},
            api: {
                getPieceData: function (piece) {
                    if(!piece.dataset['nonupdateable']) {
                        return Redaxtor.defaultApi.getPieceData(piece)
                    } else {
                        return new Promise(function (resolve, reject) {
                            var data = piece.dataset;
                            data.data = piece.data;
                            $.ajax({
                                type: "POST",
                                contentType: "application/json",
                                headers: {
                                    "X-CSRF-TOKEN": window.csrfToken
                                },
                                data: JSON.stringify(data),
                                url: "<?= uri('api_pieces', ['action' => 'get']) ?>"
                            }).done(function (resp) {
                                resp.piece.data.updateNode = false; //Force non updates of node
                                piece.data = resp.piece.data;
                                resolve(piece);
                            }).fail(function (error) {
                                reject(error);
                            });
                        });
                    }
                },
                getImageList: function () {
                    return new Promise(function (resolve, reject) {
                        $.get({
                            url: "<?= uri('api_images_list') ?>",
                            dataType: "json"
                        }).done(function (data) {
                            resolve(data.map(function (image) {
                                var thumb = image.thumbnail_uri;
                                if (!thumb || '' == thumb) {
                                    thumb = image.uri;
                                }

                                return {
                                    "url": image.compressed_uri,
                                    "thumbnailUrl": thumb
                                    //   "width": 592,
                                    //   "height": 400
                                };
                            }));
                        }).fail(function (error) {
                            reject(error);
                        });
                    });
                },
                uploadImage: function (formData) {
                    return new Promise(function (resolve, reject) {
                        //formData is FormData with image field. Add rest to formData if needed and submit.
                        $.ajax({
                            type: "POST",
                            url: "<?= uri('api_images_upload') ?>",
                            processData: false,
                            contentType: false,
                            data: formData
                        }).done(function (data) {
                            var thumb = data.image.thumbnail_uri;

                            if (!thumb || '' == thumb) {
                                thumb = data.image.uri;
                            }

                            resolve({
                                "url": data.image.compressed_uri,
                                "thumbnailUrl": thumb
                                //  "width": 592,
                                //  "height": 400
                            });
                        }).fail(function (error) {
                            reject(error);
                        });
                    });
                },
                savePieceData: function (piece) {
                    return new Promise(function (resolve, reject) {
                        var data = piece.dataset;
                        data.data = piece.data;

                        if(piece.type == 'seo') {
                            // TODO: Send SEO
                            // data.html - Page Headers Html
                            // data.title
                            // data.description
                            // data.keywords

                            $.ajax({
                                type: "POST",
                                contentType: "application/json",
                                headers: {
                                    "X-CSRF-TOKEN": window.csrfToken
                                },
                                data: JSON.stringify(data),
                                url: "<?= uri('api_seo', ['action' => 'save']) ?>"
                            }).done(function () {
                                resolve();
                            }).fail(function (error) {
                                reject(error);
                            });
                        } else {
                            $.ajax({
                                type: "POST",
                                contentType: "application/json",
                                headers: {
                                    "X-CSRF-TOKEN": window.csrfToken
                                },
                                data: JSON.stringify(data),
                                url: "<?= uri('api_pieces', ['action' => 'save']) ?>"
                            }).done(function () {
                                resolve();
                            }).fail(function (error) {
                                reject(error);
                            });
                        }
                    });
                }
            }
        });

        redaxtor.attachSeo({
            html: "" // TODO: Custom page header html
            // title: "Override page title tag"
            // description: "Override page meta[description] tag
            // keywords: "Override page meta[keywords] tag
        });
    </script>
<?php endif; ?>