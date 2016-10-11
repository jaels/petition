
(function() {

    var canv = document.getElementById('canv');
    var context = canv.getContext('2d');
    var offLeft;
    var offTop;
    var prevX;
    var prevY;
    var dataURL;

    getOffset(canv);
    function getOffset(canv) {
        offLeft = 0;
        offTop = 0;
        while(canv && !isNaN(canv.offsetLeft) && !isNaN(canv.offsetTop)) {
            offLeft += canv.offsetLeft - canv.scrollLeft;
            offTop += canv.offsetTop - canv.scrollTop;
            canv = canv.offsetParent;
        }
    }

    canv.addEventListener('mousedown', function() {
        prevX = event.clientX-offLeft;
        prevY = event.clientY-offTop;
        canv.addEventListener("mousemove", move);

    });

    canv.addEventListener('mouseup', function() {
        canv.removeEventListener('mousemove', move);

        dataURL = canv.toDataURL();
        document.getElementById('signature').value = dataURL;
    });

    function move(event) {
        var x = event.clientX-offLeft;
        var y = event.clientY-offTop;
        context.strokeStyle = '#0000FF';
        context.lineWidth=3;
        context.beginPath();
        context.moveTo(prevX,prevY);
        context.lineTo(x,y);
        context.stroke();
        prevX = x;
        prevY = y;
    }

    document.getElementById('submit').addEventListener('click', function(e) {
        if(!(document.getElementById('first-name').value)||!(document.getElementById('last-name').value)|| !(document.getElementById('signature').value)){                             e.preventDefault();
            alert('You need to fill all the fields');
        }
    });

    // document.getElementById('sign-in-botton').addEventListener('click', function(e) {
    //     console.log('heyyy');
    //     if(!(document.getElementById('user-first-name').value)||!(document.getElementById('user-last-name').value)|| !(document.getElementById('user-email').value)|| !(document.getElementById('user-password').value)){                             e.preventDefault();
    //         alert('You need to fill all the fields');
    //     }
    // });




}());
