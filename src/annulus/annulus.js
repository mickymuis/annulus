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
        this._excitement = 0.0;
        this.svgarea = svgarea;

        svgarea.viewbox = [-2,-2,4,4];
        
        // create the circle node, set attributes, and append it to the SVG node
        this._path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this._path.setAttributeNS(null, 'fill', 'blue');
        this.svgarea.svg_elem.appendChild(this._path);

        this.update();

    }
    
    get color0()        { return this._palette[0]; }
    set color0(c)       { this._palette[0] =c; this.update(); }
    get color1()        { return this._palette[1]; }
    set color1(c)       { this._palette[1] =c; this.update(); }
    get color2()        { return this._palette[2]; }
    set color2(c)       { this._palette[2] =c; this.update(); }

    get excitement()    { return this._excitement; }
    set excitement(e)   { this._excitement = e; this.update(); }

    update() {
        this._path.setAttributeNS(null, 'fill', this.rgbToHex( this.excitementToColor( this._excitement ) ) );
        this._path.setAttributeNS(null, 'd', this.createPath() );
    }

    excitementToColor( ex ) {
        // Linearly interpolate over the colors in _palette using .5 as midpoint
        let scaled = ex / EXCITEMENT_SCALE;

        return (scaled < .5)
            ? this.colorLerp( this._palette[0], this._palette[1], scaled * 2.0 )
            : this.colorLerp( this._palette[1], this._palette[2], (scaled-.5) * 2.0 );
    }

    colorLerp( c1, c2, x ) {
        return [
            Math.floor(c2[0] * x + c1[0] * (1.0-x)),
            Math.floor(c2[1] * x + c1[1] * (1.0-x)),
            Math.floor(c2[2] * x + c1[2] * (1.0-x)) ];
    }

    rgbToHex( rgb ) {
        return '#' + rgb[0].toString(16) + rgb[1].toString(16) + rgb[2].toString(16);
    }

    createPath() {
        const r = 1.0;
        const in_segs = 20; // Number of inner segments
        const out_segs = 20; // Number of outer segments
        const thickness = 0.5; // Thickness of the ring
        const t = r * (1.0-thickness);

        let p = "";
        
        let theta =0;
        let theta_step =(Math.PI*2)/in_segs;
        let hdist =(4/3)*Math.tan( Math.PI/(in_segs*2) );

        for( let i =0 ; i <= in_segs; i++ ) {
            
            let re =r+this._excitement;

            let cx1=(Math.cos( theta ) - hdist * Math.sin( theta )) * re;
            let cy1=(Math.sin( theta ) + hdist * Math.cos( theta )) * re;
            
            theta += theta_step;
            let px =Math.cos( theta ) * r;
            let py =Math.sin( theta ) * r;

            let cx2=(Math.cos( theta ) + hdist * Math.sin( theta  )) * re;
            let cy2=(Math.sin( theta ) - hdist * Math.cos( theta  )) * re;
            
            if( i == 0 )
                p += " M" + px.toFixed(5) + "," + py.toFixed(5);
            else
                p += " C" 
                    + cx1.toFixed(5) + "," + cy1.toFixed(5) + " " 
                    + cx2.toFixed(5) + "," + cy2.toFixed(5) + " " 
                    + px.toFixed(5) + "," + py.toFixed(5);
            
           //if( i != 0 ) continue;

          /*  let l = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            l.setAttributeNS(null, 'stroke-width', '0.001');
            l.setAttributeNS(null, 'stroke', 'white');
            l.setAttributeNS(null, 'd', "M"  
                    + cx1.toFixed(5) + "," + cy1.toFixed(5) + " L" 
                    + cx2.toFixed(5) + "," + cy2.toFixed(5) + " Z" ); 
            this.svgarea.svg_elem.appendChild(l);
            
            let c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttributeNS(null, 'fill', 'red');
            c.setAttributeNS(null, 'r', '0.01');
            c.setAttributeNS(null, 'cx', px.toFixed(5) );
            c.setAttributeNS(null, 'cy', py.toFixed(5) );
            this.svgarea.svg_elem.appendChild(c);*/
        }
        
        theta =0;
        theta_step =-(Math.PI*2)/out_segs;

        for( let i =0 ; i <= out_segs; i++ ) {
            theta += theta_step;
            let px =Math.cos( theta ).toFixed(5) * t;
            let py =Math.sin( theta ).toFixed(5) * t;
            if( i == 0 )
                p += " M" + px + "," + py;
            else
                p += " L" + px + "," + py;
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
        f_a.add( this.annulus, 'excitement', 0.0, EXCITEMENT_SCALE ).name( 'Excitement' ).step( 0.01 * EXCITEMENT_SCALE );
        f_a.open();

        // Colors toolbox
        let f_c = this.toolbox.addFolder( 'Colors' );
        f_c.addColor( this.annulus, 'color0' ).name( 'Low' ).onFinishChange( () => { this.annulus.update(); } ) ;
        f_c.addColor( this.annulus, 'color1' ).name( 'Medium' );
        f_c.addColor( this.annulus, 'color2' ).name( 'High' );
//        f_c.addColor( this.viewport, 'backgroundColor' ).name( 'Background' );
        f_c.open();

    }
}

export default {
    App : App
};
