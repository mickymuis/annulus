const COLOR0 = [ 60, 200, 80 ];
const COLOR1 = [ 250, 195, 50 ];
const COLOR2 = [ 250, 30, 50 ];
const EXCITEMENT_SCALE = 1.0;


class SVGArea {
    constructor( { container_elem = null } ) {
        this.container_elem =container_elem;

        this.svg_elem = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg_elem.setAttributeNS(null, 'preserveAspectRatio', 'xMidYMid meet' );
        this.viewbox = [0,0,100,100];
        this.container_elem.appendChild(this.svg_elem);

    }

    set viewbox(v) {
        this.svg_elem.setAttributeNS(null, 'viewBox', v[0] + ' ' + v[1] + ' ' + v[2] + ' ' + v[3]);
        this._viewbox =v;
    }

    get viewbox() { return this._viewbox; }

    
}

class Annulus {

    constructor( svgarea  ) {
        this._palette = [ COLOR0, COLOR1, COLOR2 ];
        this._stress = 0.0;
        this._showDebug = true;
        this._frame =0;
        this._time =0;
        this._speed =0.000005;
        this._animate =false;
        this.svgarea = svgarea;

        svgarea.viewbox = [-2,-2,4,4];
        
        // Create an SVG node for the actual visualisation
        this._path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this._path.setAttributeNS(null, 'fill', 'blue');
        this.svgarea.svg_elem.appendChild(this._path);
        
        // Add another group for debug elements
        this._debugg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svgarea.svg_elem.appendChild(this._debugg);

        this.update();

    }
    
    get color0()        { return this._palette[0]; }
    set color0(c)       { this._palette[0] =c; this.update(); }
    get color1()        { return this._palette[1]; }
    set color1(c)       { this._palette[1] =c; this.update(); }
    get color2()        { return this._palette[2]; }
    set color2(c)       { this._palette[2] =c; this.update(); }

    get stress()    { return this._stress; }
    set stress(e)   { this._stress = e; this.update(); }

    get showDebug()     { return this._showDebug; }
    set showDebug(b)    { this._showDebug =b; this.update(); }

    get frame()         { return this._frame; }
    set frame(f)        { this._frame =f; this.update(); }

    get animate()       { return this._animate; }
    set animate(b)      { this._animate = b; this.start(); }

    update() {
        this._path.setAttributeNS(null, 'fill', this.rgbToHex( this.stressToColor( this._stress ) ) );
        this._path.setAttributeNS(null, 'd', this.createPath() );
    }

    start() {
        if( this._animate == false ) return;

        const animateStep = (timestamp) => {
            if( this._animate == false ) return;
            if( !this._time ) this._time =timestamp;
            let delta = this._time - timestamp;
            
            this._frame += delta * this._speed;
            while( this._frame >= 1.0 ) this._frame -= 1.0;
            
            this._time = timestamp;
            this.update();
            window.requestAnimationFrame( animateStep );
        }
        window.requestAnimationFrame( animateStep );
    }

    stressToColor( stress ) {
        // Linearly interpolate over the colors in _palette using .5 as midpoint
        let scaled = stress / EXCITEMENT_SCALE;

        return (scaled < .5)
            ? this.colorLerp( this._palette[0], this._palette[1], scaled * 2.0 )
            : this.colorLerp( this._palette[1], this._palette[2], (scaled-.5) * 2.0 );
    }

    /* Given two rgb arrays [r,g,b] @c1 and @c2,
     * linearly interpolate between @c1 and @c2 at @x 
     */
    colorLerp( c1, c2, x ) {
        return [
            Math.floor(c2[0] * x + c1[0] * (1.0-x)),
            Math.floor(c2[1] * x + c1[1] * (1.0-x)),
            Math.floor(c2[2] * x + c1[2] * (1.0-x)) ];
    }

    /* Given an array of rgb values @rgb, return its HTML hex notation
     */
    rgbToHex( rgb ) {
        return '#' + rgb[0].toString(16) + rgb[1].toString(16) + rgb[2].toString(16);
    }

    /* Divides a sinewave 'oscillator' into @n segments, 
     * then returns from the @i-th segment the value @frame on the interval [0;1)
     * The returned value is on the interval [0;1]
     */
    oscillator( n, i, frame ) {
        const period = Math.PI * (n*.789);
        return (Math.sin( (i/n + frame) * period ) + 1.0) / 2.0; 
    }

    createPath() {
        const r = 1.0;
        const out_segs = 40; // Number of inner segments
        const in_segs = 40; // Number of outer segments
        const thickness = 0.5; // Thickness of the ring
        const t = r * (1.0-thickness);
        const s = Math.pow( this._stress, 2 ) + 0.05;

        // Clear out the debug stuff
        while( this._debugg.lastChild ) this._debugg.removeChild( this._debugg.lastChild );

        let p = "";
        
        let theta =0;
        let theta_step =(Math.PI*2)/out_segs;
        let hdist =(4/3)*Math.tan( Math.PI/(out_segs*2) );
        
        let prng = 123456789; // Seed for prng
        let next_theta = function() {
                prng ^= ( prng << 13 );
                prng ^= ( prng >>> 7 );
                prng ^= ( prng << 17 );
                let q =prng / (-1>>>0) + 1.0;
                //console.log( q );
                return theta + theta_step * q;
            };

        //for( let i =0 ; i <= out_segs; i++ ) {
            
        let prev_px =0; let prev_py =0;

        for( let i =0; i <= out_segs; i++) {
            
            let osc =this.oscillator( out_segs, i % out_segs, this._frame);  
            let re =r + (osc+.5)  * s / (r*4);
            let re1=r + (osc+.5)  * s / (r*16);
            let re2=r + (1-osc+.5)* s / (r*16);
            
            let prev_theta =theta;
            theta += theta_step * (1-osc+.49);
            //theta =next_theta();

            if( i == out_segs ) theta = 2*Math.PI;

            hdist =(4/3)*Math.tan( (theta-prev_theta)/4 );

            let px =Math.cos( theta ) * re;
            let py =Math.sin( theta ) * re;
            
            let cx1=(Math.cos( prev_theta ) - hdist * Math.sin( prev_theta )) * re1;
            let cy1=(Math.sin( prev_theta ) + hdist * Math.cos( prev_theta )) * re1;

            let cx2=(Math.cos( theta ) + hdist * Math.sin( theta  )) * re2;
            let cy2=(Math.sin( theta ) - hdist * Math.cos( theta  )) * re2;
            
            if( i == 0 ) {
                p += " M" + 1*re + "," + 0*re;
                prev_px = 1*re; prev_py = 0*re;
            }
            p += " C" 
                + cx1.toFixed(5) + "," + cy1.toFixed(5) + " " 
                + cx2.toFixed(5) + "," + cy2.toFixed(5) + " " 
                + px.toFixed(5) + "," + py.toFixed(5);
            
            if( this._showDebug ) {

                // Only boring debug-stuffs below

                let l1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                l1.setAttributeNS(null, 'stroke-width', '0.002');
                l1.setAttributeNS(null, 'stroke', 'white');
                l1.setAttributeNS(null, 'd', "M"  
                        + cx2.toFixed(5) + "," + cy2.toFixed(5) + " L" 
                        + px.toFixed(5) + "," + py.toFixed(5) + " M"
                        + cx1.toFixed(5) + "," + cy1.toFixed(5) + " L" 
                        + prev_px.toFixed(5) + "," + prev_py + " Z" ); 
                this._debugg.appendChild(l1);
                
                let h1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                h1.setAttributeNS(null, 'fill', 'magenta');
                h1.setAttributeNS(null, 'width', '0.02');
                h1.setAttributeNS(null, 'height', '0.02');
                h1.setAttributeNS(null, 'x', cx1.toFixed(5)-0.01 );
                h1.setAttributeNS(null, 'y', cy1.toFixed(5)-0.01 );
                this._debugg.appendChild(h1);
                
                let h2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                h2.setAttributeNS(null, 'fill', 'cyan');
                h2.setAttributeNS(null, 'width', '0.02');
                h2.setAttributeNS(null, 'height', '0.02');
                h2.setAttributeNS(null, 'x', cx2.toFixed(5)-0.01 );
                h2.setAttributeNS(null, 'y', cy2.toFixed(5)-0.01 );
                this._debugg.appendChild(h2);
                
                let c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                c.setAttributeNS(null, 'fill', 'red');
                c.setAttributeNS(null, 'r', '0.01');
                c.setAttributeNS(null, 'cx', px.toFixed(5) );
                c.setAttributeNS(null, 'cy', py.toFixed(5) );
                this._debugg.appendChild(c);
            }

            prev_px =px; prev_py =py;

        }
        
        theta =0;
        theta_step =-(Math.PI*2)/in_segs;

        for( let i =0 ; i <= in_segs; i++ ) {
            let osc =this.oscillator( in_segs, i % in_segs, this._frame);  
            let re =t;// + (osc)  * 0.02
            let re1=t;// + (osc)  * 0.01
            let re2=t;// + (1-osc)* 0.01
            
            let prev_theta =theta;
            theta += theta_step * (1-osc+.49);

            if( i == in_segs ) theta = 2*Math.PI;

            hdist =(4/3)*Math.tan( (theta-prev_theta)/4 );

            let px =Math.cos( theta ) * re;
            let py =Math.sin( theta ) * re;
            
            let cx1=(Math.cos( prev_theta ) - hdist * Math.sin( prev_theta )) * re1;
            let cy1=(Math.sin( prev_theta ) + hdist * Math.cos( prev_theta )) * re1;

            let cx2=(Math.cos( theta ) + hdist * Math.sin( theta  )) * re2;
            let cy2=(Math.sin( theta ) - hdist * Math.cos( theta  )) * re2;
            
            if( i == 0 ) {
                p += " M" + 1*re + "," + 0*re;
                prev_px = 1*re; prev_py = 0*re;
            }
            p += " C" 
                + cx1.toFixed(5) + "," + cy1.toFixed(5) + " " 
                + cx2.toFixed(5) + "," + cy2.toFixed(5) + " " 
                + px.toFixed(5) + "," + py.toFixed(5);
        }


        return p;
    }


}

class App {
    constructor( { container_id ='' } ) {
        console.log( 'niemand ter aarde weet, hoe het eigenlijk begon, het droevige verhaal van de nozem en de non' );

        // Create a viewport container inside the given element id
        this.container_elem =document.getElementById( container_id );
        if( typeof this.container_elem == 'undefined' )
            this.container_elem =document.body;

        let svg_elem = document.createElement( 'img' );
            svg_elem.className = 'svgarea';
        this.container_elem.appendChild( svg_elem );

        this.svgarea = new SVGArea( { container_elem: svg_elem } );

        this.annulus = new Annulus( this.svgarea );
     
        this.setupToolbox();
    }

    setupToolbox() {
        this.toolbox = new dat.GUI( );
        
        let f_a = this.toolbox.addFolder( 'Annulus' );
        f_a.add( this.annulus, 'stress', 0.0, EXCITEMENT_SCALE ).name( 'Stress' ).step( 0.01 * EXCITEMENT_SCALE );
        f_a.open();

        // Colors toolbox
        let f_c = this.toolbox.addFolder( 'Colors' );
        f_c.addColor( this.annulus, 'color0' ).name( 'Low' ).onFinishChange( () => { this.annulus.update(); } ) ;
        f_c.addColor( this.annulus, 'color1' ).name( 'Medium' );
        f_c.addColor( this.annulus, 'color2' ).name( 'High' );
//        f_c.addColor( this.viewport, 'backgroundColor' ).name( 'Background' );
        f_c.open();
        
        let f_p = this.toolbox.addFolder( 'Parameters' );
        f_p.add( this.annulus, 'showDebug' ).name( 'Debug' );
        //f_p.add( this.annulus, 'frame', 0.0, 1.0 ).name( 'Frame' ).step( 0.01);
        f_p.add( this.annulus, 'animate' ).name( 'Animate' );
        f_p.open();

    }
}

export default {
    App : App
};
