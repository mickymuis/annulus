const GREEN = [ 60, 200, 80 ];
const YELLOW = [ 250, 195, 50 ];
const YELLOW2 = [ 220, 209, 180 ];
const RED = [ 250, 30, 50 ];
const GREY = [ 150, 150, 150 ];
const EXCITEMENT_SCALE = 1.0;
const BACKGROUND = [ 50, 50, 50 ];
// Face 'enum'
const FACE_NONE =0;
const FACE_SIMPLE =1;
const FACE_TROUBLED =2;
const FACE_SAD =3;
 
/* 
 * Utility functions 
 */


/* Given two rgb arrays [r,g,b] @c1 and @c2,
 * linearly interpolate between @c1 and @c2 at @x 
 */
function colorLerp( c1, c2, x ) {
    return [
        Math.floor(c2[0] * x + c1[0] * (1.0-x)),
        Math.floor(c2[1] * x + c1[1] * (1.0-x)),
        Math.floor(c2[2] * x + c1[2] * (1.0-x)) ];
}

/* Given an array of rgb values @rgb, return its HTML hex notation
 */
function rgbToHex( rgb ) {
    return '#' + rgb[0].toString(16) + rgb[1].toString(16) + rgb[2].toString(16);
}

/* Divides a sinewave 'oscillator' into @n segments, 
 * then returns from the @i-th segment the value @frame on the interval [0;1)
 * The returned value is on the interval [0;1]
 */
function oscillator( n, i, frame ) {
    const period = Math.PI * (n*.789);
    return (Math.sin( (i/n + frame) * period ) + 1.0) / 2.0; 
}

/*
 *  SVGArea
 */
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

/*
 * Abstract 'Vis' class that represents a visualisation
 */

class Vis {
    constructor( annulus ) {
        this._parent   =annulus;
        this._palette  =[[0,0,0],[0,0,0],[0,0,0],[0,0,0]];
        this._thickness=0.5;
        this._segs     =10;
        this._face     =FACE_NONE;
    }

    get color0()        { return this._palette[0]; }
    set color0(c)       { this._palette[0] =c; }
    get color1()        { return this._palette[1]; }
    set color1(c)       { this._palette[1] =c; }
    get color2()        { return this._palette[2]; }
    set color2(c)       { this._palette[2] =c; }
    get colorbg()       { return this._palette[3]; }
    set colorbg(c)      { this._palette[3] =c; }

    get segments()      { return this._segs; }
    set segments(n)     { this._segs = n; }

    get thickness()     { return this._thickness; }
    set thickness(n)    { this._thickness =n; }

    get face()          { return this._face; }
    set face(b)         { this._face =b; }
    
    update( elem )      { }
    
    /* Linearly interpolate over _palette 0..2 by @stress on interval [0;1], using .5 as midpoint 
     */
    stressToColor( stress ) {
        // Linearly interpolate over the colors in _palette using .5 as midpoint
        let scaled = stress / EXCITEMENT_SCALE;

        return (scaled < .5)
            ? colorLerp( this._palette[0], this._palette[1], scaled * 2.0 )
            : colorLerp( this._palette[1], this._palette[2], (scaled-.5) * 2.0 );
    }

    makeFace( elem, r, color ) {
        var makePath =function( elem, p, r, color ) {
            let m = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            m.setAttributeNS(null, 'fill', 'none');
            m.setAttributeNS(null, 'stroke', rgbToHex(color));
            m.setAttributeNS(null, 'stroke-width', .1 * r);
            m.setAttributeNS(null, 'stroke-linecap', 'round');
            m.setAttributeNS(null, 'd', p );
            elem.appendChild(m);
        }
        if( this.face == FACE_SIMPLE ) {
            let y = .25 * r;
            let y2 =r * (.5 - this._parent._stress / EXCITEMENT_SCALE);
             
            // Mouth
            let p = " M " + -.5 * r + ", " + y + " Q0, " + (y2 + y) + ", " + .5 * r + ", " + y;
            makePath( elem, p, r, color );

            // Eyes
            let leye = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            leye.setAttributeNS(null, 'fill', rgbToHex(color));
            leye.setAttributeNS(null, 'r', .05 * r);
            leye.setAttributeNS(null, 'cx', -.7 * r);
            leye.setAttributeNS(null, 'cy', 0);
            elem.appendChild(leye);
            
            let reye = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            reye.setAttributeNS(null, 'fill', rgbToHex(color));
            reye.setAttributeNS(null, 'r', .05 * r);
            reye.setAttributeNS(null, 'cx', .7 * r);
            reye.setAttributeNS(null, 'cy', 0);
            elem.appendChild(reye);
        } else if ( this.face == FACE_TROUBLED ) {
            
            // Mouth
            let y = .25 * r;
            let y1 = r * .5;
            let y2 = r * (.5 - this._parent._stress / EXCITEMENT_SCALE);
             
            let p = " M" + -.5 * r + ", " + y 
                + " C" + -.25 * r + ", " + (y2 + y) 
                + " " + .25 * r + ", " + (y1 + y) 
                + " " + .5 * r + ", " + y;
            makePath( elem, p, r, color );

            // Eyes
            let x3 = r * (.2 * this._parent._stress / EXCITEMENT_SCALE); 
            let y3 = r * (.12 * this._parent._stress / EXCITEMENT_SCALE); 

            let eyes = " M" + -.6 * r + ", " + 0
                     + " l" + (-x3) + ", " + (-y3)
                     + " M" + -.6 * r + ", " + 0
                     + " l" + (-x3) + ", " + y3
                     + " M" + .6 * r + ", " + 0
                     + " l" + x3 + ", " + (-y3)
                     + " M" + .6 * r + ", " + 0
                     + " l" + x3 + ", " + y3;
            makePath( elem, eyes, r, color );
        } else if ( this.face == FACE_SAD ) {
            
            // Mouth
            let y = .25 * r;
            let y1 = r * .5;
            let y2 = r * (.5 - this._parent._stress / EXCITEMENT_SCALE);
             
            let p = " M" + -.5 * r + ", " + y 
                + " C" + -.25 * r + ", " + (y2 + y) 
                + " " + .25 * r + ", " + (y1 + y) 
                + " " + .5 * r + ", " + y;
            makePath( elem, p, r, color );

            // Eyes
            let x3 = r * (.15 * this._parent._stress / EXCITEMENT_SCALE); 
            let y3 = r * (.05 * this._parent._stress / EXCITEMENT_SCALE); 

            let eyes = " M" + -.6 * r + ", " + (-y3)
                     + " l" + x3 + ", " + (-y3*2)
                     + " M" + .6 * r + ", " + (-y3)
                     + " l" + (-x3) + ", " + (-y3*2)
            makePath( elem, eyes, r, color );
        }

    }

}

class RingVis extends Vis {
    constructor( annulus ) {
        super( annulus );
        this._palette  =[GREEN,YELLOW,RED,BACKGROUND];
        this._thickness=0.5;
        this._segs     =50;
    }

    /* Return the SVG path obtained by rendering with the current parameters.
     * Additionally, if showDebug is true, this function adds points and handles to the debugg SVG group element.
     */
    update( elem ) {
        const r = 1.0;
        const out_segs = this.segments; // Number of inner segments
        const in_segs = this.segments; // Number of outer segments
        const thickness = this.thickness; // Thickness of the ring
        const t = r * (1.0-thickness);
        const s = Math.pow( this._parent._stress / EXCITEMENT_SCALE,  2 ) + 0.05;
        const col = super.stressToColor( this._parent.stress );
        const color_str =rgbToHex( col ); 

        // Clear out the old stuff
        while( elem.lastChild ) elem.removeChild( elem.lastChild );
        while( this._parent.debugg.lastChild ) this._parent.debugg.removeChild( this._parent.debugg.lastChild );
        
        // Step one, the central path (cicle/cloud shape)
        let circle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        circle.setAttributeNS(null, 'fill', color_str);
        elem.appendChild(circle);

        let p = "";
        
        // Outer circle
        //

        let theta =0;
        let theta_step =(Math.PI*2)/out_segs;
        let hdist =0;
       
        let prev_px =0; let prev_py =0;

        for( let i =0; i < out_segs; i++) {
            
            let osc =oscillator( out_segs, i % (out_segs-1), this._parent._frame);  
            let re =r + (osc+.5)  * s / (r*4);
            let re1=r - (1-osc+.5) * s / (r*8);
            let re2=r - (1-osc+.5) * s / (r*8);
            
            let prev_theta =theta;
            if( i == out_segs - 1 )
                theta =Math.PI*2;
            else
                theta += theta_step * (1-osc+.5);

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
            
            if( this._parent._showDebug ) {

                // Only boring debug-stuffs below

                let l1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                l1.setAttributeNS(null, 'stroke-width', '0.002');
                l1.setAttributeNS(null, 'stroke', 'white');
                l1.setAttributeNS(null, 'd', "M"  
                        + cx2.toFixed(5) + "," + cy2.toFixed(5) + " L" 
                        + px.toFixed(5) + "," + py.toFixed(5) + " M"
                        + cx1.toFixed(5) + "," + cy1.toFixed(5) + " L" 
                        + prev_px.toFixed(5) + "," + prev_py + " Z" ); 
                this._parent.debugg.appendChild(l1);
                
                let h1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                h1.setAttributeNS(null, 'fill', 'magenta');
                h1.setAttributeNS(null, 'width', '0.02');
                h1.setAttributeNS(null, 'height', '0.02');
                h1.setAttributeNS(null, 'x', cx1.toFixed(5)-0.01 );
                h1.setAttributeNS(null, 'y', cy1.toFixed(5)-0.01 );
                this._parent.debugg.appendChild(h1);
                
                let h2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                h2.setAttributeNS(null, 'fill', 'cyan');
                h2.setAttributeNS(null, 'width', '0.02');
                h2.setAttributeNS(null, 'height', '0.02');
                h2.setAttributeNS(null, 'x', cx2.toFixed(5)-0.01 );
                h2.setAttributeNS(null, 'y', cy2.toFixed(5)-0.01 );
                this._parent.debugg.appendChild(h2);
                
                let c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                c.setAttributeNS(null, 'fill', 'red');
                c.setAttributeNS(null, 'r', '0.01');
                c.setAttributeNS(null, 'cx', px.toFixed(5) );
                c.setAttributeNS(null, 'cy', py.toFixed(5) );
                this._parent.debugg.appendChild(c);
            }

            prev_px =px; prev_py =py;

        }
        
        // Inner circle
        //
        theta =0;
        theta_step =-(Math.PI*2)/in_segs;

        for( let i =0 ; i <= in_segs; i++ ) {
            let osc =oscillator( in_segs, i % in_segs, this._parent._frame);  
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


        circle.setAttributeNS(null, 'd', p);

        // The face
        //

        this.makeFace( elem, this.thickness == 1 ? r : t, this.thickness == 1 ? this.colorbg : col );
    }
}

class WeerVis extends Vis {
    constructor( annulus ) {
        super( annulus );
        this._palette  =[YELLOW,YELLOW2,GREY,BACKGROUND];
        this._thickness=0.5;
        this._segs     =10;
    }

    /* Return the SVG path obtained by rendering with the current parameters.
     * Additionally, if showDebug is true, this function adds points and handles to the debugg SVG group element.
     */
    update( elem ) {
        const r = 1.0;
        const out_segs = this.segments; // Number of inner segments
        const in_segs = this.segments; // Number of outer segments
        const thickness = this.thickness; // Thickness of the ring
        const t = r * (1.0-thickness);
        const s = Math.pow( this._parent._stress / EXCITEMENT_SCALE,  2 );// + 0.05;
        const color_str =rgbToHex( super.stressToColor( this._parent.stress ) ); 

        // Clear out old stuff
        while( this._parent.debugg.lastChild ) this._parent.debugg.removeChild( this._parent.debugg.lastChild );
        while( elem.lastChild ) elem.removeChild( elem.lastChild );

        // Step one, the central path (cicle/cloud shape)
        let circle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        circle.setAttributeNS(null, 'fill', color_str);
        elem.appendChild(circle);
        
        let p = "";
        
        let theta =0;
        let theta_step =(Math.PI*2)/out_segs;
        let hdist =0;
       
        let prev_px =0; let prev_py =0;

        for( let i =0; i < out_segs; i++) {
            
            let osc =oscillator( out_segs-1, i % (out_segs-1), this._parent._frame);  
            let re1 =r + (osc+.5)   * s / (r*8);
            let re2 =r - (1-osc+.5) * s / (r*16);
            
            let prev_theta =theta;
            if( i == out_segs - 1 )
                theta =Math.PI*2;
            else
                theta += theta_step * .75 + theta_step * .25 * (1-osc+.45);
            //theta +=theta_step;
            //theta =next_theta();


            hdist =(4/3)*Math.tan( (theta-prev_theta)/4 );

            let px =Math.cos( theta ) * re2;
            let py =Math.sin( theta ) * re2;
            
            let cx1=(Math.cos( prev_theta ) - hdist * Math.sin( prev_theta )) * re1;
            let cy1=(Math.sin( prev_theta ) + hdist * Math.cos( prev_theta )) * re1;

            let cx2=(Math.cos( theta ) + hdist * Math.sin( theta  )) * re1;
            let cy2=(Math.sin( theta ) - hdist * Math.cos( theta  )) * re1;
            
            if( i == 0 ) {
                p += " M" + 1*re2 + "," + 0*re2;
                prev_px = 1*re2; prev_py = 0*re2;
            }
            p += " C" 
                + cx1.toFixed(5) + "," + cy1.toFixed(5) + " " 
                + cx2.toFixed(5) + "," + cy2.toFixed(5) + " " 
                + px.toFixed(5) + "," + py.toFixed(5);
            
            if( this._parent._showDebug ) {

                // Only boring debug-stuffs below

                let l1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                l1.setAttributeNS(null, 'stroke-width', '0.002');
                l1.setAttributeNS(null, 'stroke', 'white');
                l1.setAttributeNS(null, 'd', "M"  
                        + cx2.toFixed(5) + "," + cy2.toFixed(5) + " L" 
                        + px.toFixed(5) + "," + py.toFixed(5) + " M"
                        + cx1.toFixed(5) + "," + cy1.toFixed(5) + " L" 
                        + prev_px.toFixed(5) + "," + prev_py + " Z" ); 
                this._parent.debugg.appendChild(l1);
                
                let h1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                h1.setAttributeNS(null, 'fill', 'magenta');
                h1.setAttributeNS(null, 'width', '0.02');
                h1.setAttributeNS(null, 'height', '0.02');
                h1.setAttributeNS(null, 'x', cx1.toFixed(5)-0.01 );
                h1.setAttributeNS(null, 'y', cy1.toFixed(5)-0.01 );
                this._parent.debugg.appendChild(h1);
                
                let h2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                h2.setAttributeNS(null, 'fill', 'cyan');
                h2.setAttributeNS(null, 'width', '0.02');
                h2.setAttributeNS(null, 'height', '0.02');
                h2.setAttributeNS(null, 'x', cx2.toFixed(5)-0.01 );
                h2.setAttributeNS(null, 'y', cy2.toFixed(5)-0.01 );
                this._parent.debugg.appendChild(h2);
                
                let c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                c.setAttributeNS(null, 'fill', 'red');
                c.setAttributeNS(null, 'r', '0.01');
                c.setAttributeNS(null, 'cx', px.toFixed(5) );
                c.setAttributeNS(null, 'cy', py.toFixed(5) );
                this._parent.debugg.appendChild(c);
            }

            prev_px =px; prev_py =py;

        }
        circle.setAttributeNS(null, 'd', p);
        
        // Step two. The face
        //

        this.makeFace( elem, r, this.colorbg );

      /*  let l = this._parent._stress < .5 ? 0 : 1;
        let r2=(10 * (.5 - Math.abs(.5 - this._parent._stress)) + .5) * r; 
        p = " M " + -.5 * r + ", 0 A" + r2 + ", " + r2 + " 0 0," + l + " " + .5 * r + ",0";
        let mouth = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        mouth.setAttributeNS(null, 'fill', 'none');
        mouth.setAttributeNS(null, 'stroke', 'black');
        mouth.setAttributeNS(null, 'stroke-width', .1 * r);
        mouth.setAttributeNS(null, 'd', p );
        elem.appendChild(mouth);*/


        // Step three. The rays/sparks/lines
        // Each line is a separate <polyline> that consists of four points
        let line_segs =2 * in_segs + in_segs * 2 * (1- this._parent._stress); 
        //let skip_lines =Math.floor(in_segs * 2 * (1.1- this._parent._stress)); 
        theta =0;//Math.PI /4 * s;
        theta_step =-(Math.PI*2)/line_segs;// + (Math.PI*2)/(in_segs*4);

        for( let i =0 ; i < line_segs; i++ ) {
            let osc =oscillator( line_segs, i % (line_segs), this._parent._frame);  
            let soff= r * 0.15 * s;     // Stress factor in offset from inner circle
            let re  = 1.1 * r + .2 * r * osc + soff; // Distance of tangential line
            let re1 = re + soff;         // Distance of outmost point
            let re2 = re - soff;         // Distance of innermost point
            
            let prev_theta =theta;
            if( i == line_segs - 1 )
                theta =0;//Math.PI/4 * s - theta_step;
            else
                theta += theta_step * .75 + theta_step * .25 * (1-osc+.45);

            //if( i % skip_lines == 0 ) continue;

            hdist =(4/3)*Math.tan( (theta-prev_theta)/4 );

            // Points of the middle/tangential line
            let px1 =Math.cos( prev_theta ) * re;
            let py1 =Math.sin( prev_theta ) * re;
            
            let px2 =Math.cos( theta - .75 * theta_step ) * re;
            let py2 =Math.sin( theta - .75 * theta_step ) * re;
            
        
            // Outer/inner points that form the 'spark'     
            let cx1=Math.cos( prev_theta ) * re1;
            let cy1=Math.sin( prev_theta ) * re1;

            let cx2=Math.cos( theta  - .75 * theta_step ) * re2;
            let cy2=Math.sin( theta  - .75 * theta_step ) * re2;
           
            let points = cx1 + "," + cy1 + " " + px1 + "," + py1 + " " + px2 + "," + py2 + " " + cx2 + "," + cy2;
            let e= document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            e.setAttributeNS(null, 'fill', 'none');
            e.setAttributeNS(null, 'stroke', color_str/*rgbToHex(this.color0)*/);
            e.setAttributeNS(null, 'stroke-width', .05 * r);
            e.setAttributeNS(null, 'stroke-linecap', 'round');
            e.setAttributeNS(null, 'stroke-linejoin', 'round');
            e.setAttributeNS(null, 'points', points );
            elem.appendChild(e);

        }

    }
}

class Annulus {

    constructor( svgarea  ) {
        this._stress            =0.0;
        this._showDebug         =false;
        this._frame             =0;
        this._time              =0;
        this._speed             =0.000008;
        this._animate           =true;
        this._vis               =null;
        this._animateStress     =false;
        this._animateStressSign =1.0;
        this.svgarea = svgarea;

        svgarea.viewbox = [-2,-2,4,4];
        
        
        // Add a group for visualisation elements
        this.pathg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svgarea.svg_elem.appendChild(this.pathg);
        
        // Add another group for debug elements
        this.debugg = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svgarea.svg_elem.appendChild(this.debugg);


    }
    
    get color0()        { return this._vis.color0; }
    set color0(c)       { this._vis.color0 =c; this.update(); }
    get color1()        { return this._vis.color1; }
    set color1(c)       { this._vis.color1 =c; this.update(); }
    get color2()        { return this._vis.color2; }
    set color2(c)       { this._vis.color2 =c; this.update(); }
    get colorbg()       { return this._vis.colorbg; }
    set colorbg(c)      { this._vis.colorbg =c; this.update(); }

    get stress()        { return this._stress; }
    set stress(e)       { this._stress = e; this.update(); }

    get showDebug()     { return this._showDebug; }
    set showDebug(b)    { this._showDebug =b; this.update(); }

    get frame()         { return this._frame; }
    set frame(f)        { this._frame =f; this.update(); }

    get animate()       { return this._animate; }
    set animate(b)      { this._animate = b; this.start(); }

    get animateStress() { return this._animateStress; }
    set animateStress(b){ this._animateStress =b; }

    get segments()      { return this._vis.segments; }
    set segments(n)     { this._vis.segments = n; this.update() }

    get thickness()     { return this._vis.thickness; }
    set thickness(n)    { this._vis.thickness =n; this.update() }

    get visualisation() { return this._vis; }
    set visualisation(v){ this._vis =v; this.update(); }

    get face()          { return this._vis.face; }
    set face(n)         { this._vis.face =n; this.update(); }
    

    update() {
        this._vis.update( this.pathg );
    }

    start() {
        if( this._animate == false ) return;

        const animateStep = (timestamp) => {
            if( this._animate == false ) return;
            if( !this._time ) this._time =timestamp;
            let delta = timestamp - this._time;
            
            if( this._animateStress == true ) {

                this._stress += delta * 0.0001 * this._animateStressSign;
                if( this._stress >= 1.0 ) {
                    this._animateStressSign =-1.0;
                    this._stress =1.0;
                } else if( this._stress <= 0.0 ) {
                    this._animateStressSign =1.0;
                    this._stress =0.0;
                }
            }
            
            this._frame += delta * (this._speed + this._stress * this._speed);
            while( this._frame >= 1.0 ) this._frame -= 1.0;

            this._time = timestamp;
            this.update();
            window.requestAnimationFrame( animateStep );
        }
        window.requestAnimationFrame( animateStep );
    }




}

class App {
    constructor( { container_id ='' } ) {
        console.log( 'niemand ter aarde weet, hoe het eigenlijk begon, het droevige verhaal van de nozem en de non' );


        // Create a viewport container inside the given element id
        this.container_elem =document.getElementById( container_id );
        if( typeof this.container_elem == 'undefined' )
            this.container_elem =document.body;

        let svg_elem = document.createElement( 'object' );
            svg_elem.className = 'svgarea';
        this.container_elem.appendChild( svg_elem );

        this.svgarea = new SVGArea( { container_elem: svg_elem } );

        this.annulus = new Annulus( this.svgarea );

        this.visList = { "Ring" : new RingVis( this.annulus ), "Weer" : new WeerVis( this.annulus ) };
        this._vis ="";
        this.vis = "Ring";
        this.annulus.start();

        this.backgroundColor = BACKGROUND;
        this.setupToolbox();
    }

    get vis()   { return this._visstr; }
    set vis(str){ 
        this._visstr =str;
        this.annulus.visualisation =this.visList[str];
        this.annulus.update();
    }

    get backgroundColor() { return this._background; }

    set backgroundColor(c) {
        this._background =c;
        document.body.style.background = rgbToHex(c);
        this.annulus.colorbg =c;
        this.annulus.update();
    }

    setupToolbox() {
        this.toolbox = new dat.GUI( );
        
        let f_a = this.toolbox.addFolder( 'Annulus' );
        f_a.add( this.annulus, 'stress', 0.0, EXCITEMENT_SCALE ).name( 'Stress' ).step( 0.01 * EXCITEMENT_SCALE ).listen();
        f_a.add( this, 'vis', [ "Ring", "Weer" ] ).name( 'Vis' );
        f_a.add( this.annulus, 'face', { None : FACE_NONE, Simple : FACE_SIMPLE, Troubled : FACE_TROUBLED, Sad : FACE_SAD } ).name( 'Face' );
        f_a.open();

        // Colors toolbox
        let f_c = this.toolbox.addFolder( 'Colors' );
        f_c.addColor( this.annulus, 'color0' ).name( 'Low' ).listen() ;
        f_c.addColor( this.annulus, 'color1' ).name( 'Medium' ).listen();
        f_c.addColor( this.annulus, 'color2' ).name( 'High' ).listen();
        f_c.addColor( this, 'backgroundColor' ).name( 'Background' ).listen();
        f_c.open();
        
        let f_p = this.toolbox.addFolder( 'Parameters' );
        f_p.add( this.annulus, 'showDebug' ).name( 'Debug' );
        //f_p.add( this.annulus, 'frame', 0.0, 1.0 ).name( 'Frame' ).step( 0.01);
        f_p.add( this.annulus, 'segments', 10, 100 ).name( 'Segments' ).step( 1 ).listen();
        f_p.add( this.annulus, 'thickness', 0, 1 ).name( 'Thickness' ).step( 0.05 ).listen();
        f_p.add( this.annulus, 'animate' ).name( 'Animate' );
        f_p.add( this.annulus, 'animateStress' ).name( 'Animate Stress' );
        f_p.open();

    }
}

export default {
    App : App
};
