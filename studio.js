(function () {
    'use strict';

    if (window.studio_plugin_loaded) return;
    window.studio_plugin_loaded = true;

    function analyzeAndInvert(img, threshold) {
        try {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            ctx.drawImage(img, 0, 0);

            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imageData.data;

            var dark = 0;
            var total = 0;

            for (var i = 0; i < data.length; i += 4) {
                var alpha = data[i + 3];
                if (alpha < 10) continue;

                total++;

                var r = data[i];
                var g = data[i + 1];
                var b = data[i + 2];

                var brightness = (r * 299 + g * 587 + b * 114) / 1000;

                if (brightness < 120) dark++;
            }

            if (total > 0 && dark / total >= threshold) {
                img.style.filter += " brightness(0) invert(1)";
            }
        } catch (e) {}
    }

    function renderStudios(render, movie) {
        if (!movie.production_companies) return;

        var html = '';

        movie.production_companies.slice(0,3).forEach(function(co){

            var content = '';

            if (co.logo_path) {
                content = '<img src="https://image.tmdb.org/t/p/h100'+co.logo_path+'" class="studio-img">';
            }
            else {
                content = '<span>'+co.name+'</span>';
            }

            html += '<div class="studio-item" data-id="'+co.id+'" data-name="'+co.name+'">'+content+'</div>';
        });

        if (!html) return;

        var block = $(
            '<div class="studio-container" style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;">'
            + html +
            '</div>'
        );

        var target = $(".full-start-new__title", render);
        if(!target.length) target = $(".full-start__title", render);

        target.after(block);

        $('.studio-img', block).each(function(){
            var img = this;

            if (img.complete) analyzeAndInvert(img,0.85);
            else img.onload = function(){
                analyzeAndInvert(img,0.85);
            };
        });

        $('.studio-item', block).on('hover:enter', function(){

            var id = $(this).data('id');

            if (!id) return;

            Lampa.Activity.push({
                url:'movie',
                id:id,
                title:$(this).data('name'),
                component:'company',
                source:'tmdb',
                page:1
            });

        });
    }

    function handleStudios(e){

        var render = e.object.activity.render();
        var card = e.data.movie;

        var type = card.first_air_date ? "tv" : "movie";

        Lampa.Api.sources.tmdb.get(
            type + "/" + card.id,
            {},
            function(data){
                renderStudios(render,data);
            },
            function(){
                renderStudios(render,card);
            }
        );
    }

    Lampa.Listener.follow('full',function(e){

        if (e.type === 'complite' || e.type === 'complete') {
            handleStudios(e);
        }

    });

})();
