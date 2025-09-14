import Navbar from "./components/Navbar";

//main tag tells the this is the main content of the page
//section tag is used to define sections in a document, such as chapters, headers, foot
export default function Homepage() {
  return (
    <>
      <main className="bg-white">
        <Navbar />
        <section>
          {/*relative positions the element relative to its normal position. this sets the position of the dive to relative
          By itself, it doesn’t move the element, but it acts as a reference point for absolutely positioned child elements.*/}
          {/*absolute use child components.absolute positions the element relative to its nearest positioned ancestor (instead of positioned relative to the viewport, 
          like fixed).*/}
          {/*overfflow hidden is used to hide any content that overflows the bounds of the element.*/}
          {/*svg is the container for vector shapes(paths, circles, polygons etc...canvas or container for drawing shapes.
          Everything inside <svg> is part of that drawng area.
           viewbox defines the internal coordinate system
           fill-none means Shapes inside the SVG won’t be colored inside (they’ll only show outlines or whatever color you give them later).
           xmlns mean Just tells the browser: “This is an SVG drawing.” Without it, the SVG might not render correctly.
           preserveAspectRatio Makes the SVG stretch to fit the box no matter the screen size, even if the shape gets a bit squished or stretched.
           */}
          <svg
            className="absolute bottom-0 right-0 h-[600px] w-[700px] z-[-10]"
            viewBox="0 0 1440 800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            {/*path draws the custom shape inside the svg
            d="..." → The path data (series of commands and coordinates) that define the curve.
            M1440 0 → Move the pen to (1440, 0).
            V800 → Draw vertical line to y=800.
            H0 → Draw horizontal line to x=0.
            C200 750 700 600 900 400 → Draw a cubic Bézier curve using control points.
            C1100 200 1200 100 1440 0Z → Another curve, then Z closes the shape.*/}
            <path
              d="M1440 0V800H0C200 750 700 600 900 400C1100 200 1200 100 1440 0Z"
              fill="#0f540e"
            />
          </svg>
        </section>
        <section>
          
        </section>
      </main>
    </>
  );
}
