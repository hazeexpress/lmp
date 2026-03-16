(function () {
'use strict';

if (window.studio_logo_plugin) return;
window.studio_logo_plugin = true;

var studiosCache = {};

function analyzeAndInvert(img, threshold){
    try{
        var canvas=document.createElement('canvas');
        var ctx=canvas.getContext('2d');
        canvas.width=img.naturalWidth;
        canvas.height=img.naturalHeight;
        ctx.drawImage(img,0,0);

        var data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
        var dark=0,total=0;

        for(var i=0;i<data.length;i+=4){
            var a=data[i+3];
            if(a<10) continue;

            total++;

            var r=data[i];
            var g=data[i+1];
            var b=data[i+2];

            var brightness=(r*299+g*587+b*114)/1000;

            if(brightness<120) dark++;
        }

        if(total>0 && dark/total>=threshold){
            img.style.filter+=" brightness(0) invert(1)";
        }
    }catch(e){}
}


function renderStudios(render, movie){

    $(".studio-logos-container",render).remove();

    if(!movie.production_companies) return;

    var html="";

    movie.production_companies.slice(0,3).forEach(function(co){

        var content="";

        if(co.logo_path){
            content='<img src="https://image.tmdb.org/t/p/h100'+co.logo_path+'" title="'+co.name+'" crossorigin="anonymous" class="studio-img">';
        }
        else{
            content='<span>'+co.name+'</span>';
        }

        html+=
        '<div class="studio-logo selector" data-id="'+co.id+'" data-name="'+co.name+'">'+
        content+
        '</div>';
    });

    if(!html) return;

    var wrap=$(
        '<div class="studio-logos-container">'+html+'</div>'
    );

    var target=$(".full-start-new__title",render);

    if(!target.length) target=$(".full-start__title",render);

    target.after(wrap);

    $(".studio-logo img",render).each(function(){

        var img=this;

        if(img.complete) analyzeAndInvert(img,0.85);
        else img.onload=function(){ analyzeAndInvert(img,0.85); };

    });

    $(".studio-logo",render).on("hover:enter",function(){

        var id=$(this).data("id");

        if(!id) return;

        Lampa.Activity.push({
            url:"movie",
            id:id,
            title:$(this).data("name"),
            component:"company",
            source:"tmdb",
            page:1
        });

    });

}


function handleStudios(e){

    var movie=e.data.movie;

    var render=e.object.activity.render();

    var now=Date.now();

    var cached=studiosCache[movie.id];

    if(cached && now-cached.time<180000){

        renderStudios(render,cached.data);

        return;
    }

    var type=movie.first_air_date ? "tv":"movie";

    Lampa.Api.sources.tmdb.get(

        type+"/"+movie.id,

        {},

        function(data){

            studiosCache[movie.id]={
                data:data,
                time:now
            };

            renderStudios(render,data);

        },

        function(){

            renderStudios(render,movie);

        }
    );
}


var style=`
.studio-logos-container{
display:flex;
gap:8px;
margin-top:10px;
flex-wrap:wrap;
}

.studio-logo{
background:rgba(255,255,255,0.08);
padding:4px 10px;
border-radius:8px;
display:flex;
align-items:center;
cursor:pointer;
}

.studio-logo img{
height:22px;
width:auto;
}
`;

$('head').append('<style>'+style+'</style>');


Lampa.Listener.follow("full",function(e){

    if(e.type==="complite" || e.type==="complete"){

        handleStudios(e);

    }

});

})();
