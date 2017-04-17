<script>
function interceptor() {

document.addEventListener("scroll", function(e){

var scrollPercentage = {"scroll":(e.pageY / window.scrollMaxY)*100};
console.dir(e); 

var req = new XMLHttpRequest(); 

req.open('POST', 'http://localhost:5000/event', true); 

req.setRequestHeader("Content-Type", "application/json"); 

req.send(JSON.stringify(scrollPercentage));
})
};
</script>
