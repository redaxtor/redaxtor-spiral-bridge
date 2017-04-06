<?php if (spiral(\Spiral\Pieces\Pieces::class)->canEdit()): ?>
    <script>
        /**
         * RedaxtorBridge variable is put in global scope in application entry point by front end engineer
         */
        RedaxtorBridge.startForSpiral({
            imageGalleryUrl: "<?= uri('api_images_list') ?>", // Url to fetch images list
            getPieceUrl: "<?= uri('api_pieces', ['action' => 'get']) ?>", // Url to fetch piece data. This is fired only for pieces that can't be read directly from DOM
            saveMetaUrl: "<?= uri('api_seo', ['action' => 'save']) ?>", // Url to save SEO data from SEO editor
            savePieceUrl: "<?= uri('api_pieces', ['action' => 'save']) ?>", // Url to save piece. This may be overrided by piece container 'data-save-url' attribute
            uploadUrl: "<?= uri('api_images_upload') ?>" // Url to upload image resources
        },
         "" // Specify HTML for custom meta page headers here for SEO Editor
        );
    </script>
<?php endif; ?>