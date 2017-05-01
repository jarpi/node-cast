<script>
function interceptor() {

    document.addEventListener("scroll", function(e){

        var scrollPercentage = {"scroll":(e.pageY / window.scrollMaxY)*100};
        console.dir(e);

        var req = new XMLHttpRequest();

        req.open('POST', 'http://192.168.1.87:5000/event', true);

        req.setRequestHeader("Content-Type", "application/json");

        req.onload = function(e) {
            if (req.readyState === 4 && req.status === 200) {
                console.dir(req.statusText);
                console.dir(req.responseText);
            }
            else {
                console.dir(req.statusText);
            }
        }

        req.onerror = function(e) {
            console.dir(req.statusText);
        }

        var body = JSON.stringify(scrollPercentage);
        console.dir(body);
        req.send(body);
    });

    document.addEventListener("click", function(e){
        console.dir(e);
        e.preventDefault();
        e.stopPropagation();
        if (e.target.pathname) {
            var url = e.originalTarget.baseURI + e.target.pathname;
            window.location.href = url;
        }
    });

    // Fix this
    window.onpopstate(function(e){
        console.dir('popstate');
        console.dir(e);
        e.preventDefault();
        e.stopPropagation();
        // window.location.href = document.location;
    });
};
interceptor();
</script>
