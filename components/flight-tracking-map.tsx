"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import L from "leaflet"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import { Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Import Leaflet CSS
import "leaflet/dist/leaflet.css"

// Fix for Leaflet marker icons in Next.js
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  })
}

// Aircraft type determination based on aircraft data
const getAircraftType = (aircraft: any) => {
  // Simplified: use small aircraft image for all aircraft types
  return 'small'
}

// Function to determine aircraft color based on altitude
const getAircraftColor = (altitude: number): string => {
  if (altitude < 1000) return "#FF4444"      // Red - Low altitude
  if (altitude < 3000) return "#FF8800"      // Orange - Medium-low altitude  
  if (altitude < 5000) return "#FFDD00"      // Yellow - Medium altitude
  if (altitude < 10000) return "#44FF44"     // Green - Medium-high altitude
  if (altitude < 20000) return "#0088FF"     // Blue - High altitude
  return "#8844FF"                           // Purple - Very high altitude
}

// Create aircraft icon with different types
const createAircraftIcon = (heading: number, altitude: number = 0, aircraftType: string = 'small') => {
  // Map aircraft types to SVG file paths
  const aircraftSvgPaths: Record<string, string> = {
    small: "/images/small.svg",
    jet: "/images/Jet.svg", 
    helicopter: "/images/helicoptor.svg",
    large: "/images/large.svg"
  }
  
  // Map aircraft types to their proper viewBoxes and image dimensions
  const aircraftSettings: Record<string, {viewBox: string, imageWidth: number, imageHeight: number}> = {
    small: {viewBox: "0 0 1024 1024", imageWidth: 1024, imageHeight: 1024},      // Full SVG canvas
    jet: {viewBox: "0 0 1024 1024", imageWidth: 1024, imageHeight: 1024},        // Full SVG canvas
    helicopter: {viewBox: "0 0 1024 1024", imageWidth: 1024, imageHeight: 1024}, // Full SVG canvas
    large: {viewBox: "0 0 1024 1024", imageWidth: 1024, imageHeight: 1024}       // Full SVG canvas
  }
  
  // Get the settings for the aircraft type
  const svgPath = aircraftSvgPaths[aircraftType] || aircraftSvgPaths.small
  const settings = aircraftSettings[aircraftType] || aircraftSettings.small
  const aircraftColor = getAircraftColor(altitude)
  
  console.log(`Creating icon for aircraft type: ${aircraftType}, altitude: ${altitude}, color: ${aircraftColor}`) // Debug log
  
  // Use aircraft-appropriate dimensions (longer than wide)
  const iconWidth = 40
  const iconHeight = 60
  
  // The airplane SVG points north by default (0°), which matches ADS-B heading convention
  // ADS-B track is degrees from north (0° = north, 90° = east, 180° = south, 270° = west)
  // No adjustment needed since both use the same reference (north = 0°)
  const adjustedHeading = heading
  
  return L.divIcon({
    html: `
      <div style="
        width: ${iconWidth}px; 
        height: ${iconHeight}px; 
        transform: rotate(${adjustedHeading}deg); 
        transform-origin: center;
      " class="aircraft-wrapper" data-rotation="${adjustedHeading}">
        <svg width="${iconWidth}" height="${iconHeight}" viewBox="${settings.viewBox}" style="width: 100%; height: 100%;">
          <path d="M0 0 C0.86797767 -0.00297112 1.73595535 -0.00594224 2.63023537 -0.0090034 C5.55592397 -0.01771602 8.48157177 -0.01920081 11.40727234 -0.02069092 C13.49795113 -0.02531728 15.58862908 -0.03034169 17.67930603 -0.03573608 C23.37149022 -0.04887964 29.06366261 -0.05530885 34.75585961 -0.05974674 C38.30946211 -0.06267433 41.86306135 -0.06677853 45.41666222 -0.07125092 C56.52733925 -0.08493102 67.63800889 -0.09459515 78.74869376 -0.09845281 C91.58863526 -0.10293491 104.42847037 -0.1204878 117.26837951 -0.1494534 C127.18349245 -0.17104702 137.09857542 -0.18115585 147.01371163 -0.18249393 C152.94004315 -0.18354362 158.86627473 -0.18948638 164.79258156 -0.20731354 C170.36656561 -0.22375409 175.94037418 -0.22596926 181.51437378 -0.21717453 C183.56184038 -0.216402 185.60931625 -0.22077519 187.65675926 -0.23063278 C190.44895521 -0.24328908 193.24052375 -0.2375099 196.03271484 -0.22705078 C197.25198015 -0.23913539 197.25198015 -0.23913539 198.49587709 -0.25146413 C203.08801146 -0.21115235 206.04866858 0.30395583 209.70683289 3.14044189 C213.0830579 6.98235311 213.21624325 10.78023448 213.06230164 15.69903564 C212.53546747 19.31740216 211.12760802 21.45069174 208.70683289 24.14044189 C205.04025477 26.67328704 201.19738803 26.40952203 196.90898132 26.36749268 C196.12811157 26.36778473 195.34724182 26.36807678 194.54270935 26.36837769 C191.967095 26.36698669 189.39177157 26.35143642 186.81620789 26.33575439 C185.02830666 26.33202344 183.24040339 26.32917686 181.45249939 26.32717896 C176.75067991 26.31954896 172.04898433 26.29990589 167.34721375 26.277771 C162.54783301 26.25729894 157.74843222 26.24817433 152.94902039 26.23809814 C143.5349035 26.21665942 134.1208785 26.18253109 124.70683289 26.14044189 C124.70683289 28.12044189 124.70683289 30.10044189 124.70683289 32.14044189 C125.28820007 32.40598877 125.86956726 32.67153564 126.46855164 32.94512939 C145.83597154 43.28794002 155.74090651 68.76592382 161.83183289 88.64044189 C169.61313145 115.14717488 173.80700706 142.9454017 173.72636414 170.56622314 C173.72495422 171.48939331 173.72354431 172.41256348 173.72209167 173.3637085 C173.71843765 175.62262637 173.71331627 177.88153067 173.70683289 180.14044189 C174.81495158 180.13873315 174.81495158 180.13873315 175.9454565 180.13698989 C219.76960805 180.06979554 263.59375398 180.01835186 307.41794676 179.98724591 C312.68481514 179.98349397 317.95168341 179.97961099 323.21855164 179.97564697 C324.26705107 179.97486004 325.3155505 179.97407311 326.39582264 179.97326233 C343.35319528 179.96022308 360.31053728 179.93657741 377.26789176 179.90898351 C394.67919818 179.88088807 412.0904886 179.86425689 429.50181675 179.85817641 C440.23783713 179.85406855 450.97377089 179.8411135 461.7097646 179.81669249 C469.08071172 179.80078419 476.45161433 179.79605303 483.82257736 179.79993776 C488.06957768 179.8018514 492.31642707 179.79900366 496.56340027 179.78282547 C500.46254125 179.76808188 504.36143173 179.76758176 508.26058495 179.77774521 C509.66059627 179.77899882 511.06062411 179.77531657 512.46060359 179.76579235 C534.03649185 179.62771509 556.5411621 184.87114682 572.76542664 200.01153564 C582.79398351 211.0086453 588.5380587 222.69498321 588.02323914 237.82403564 C586.65726746 252.14144245 578.70764756 264.16476842 568.05448914 273.45294189 C551.13889927 286.89459182 530.75801105 292.07688566 509.70683289 294.70294189 C508.12695675 294.90968237 506.54720653 295.11738703 504.96757507 295.32598877 C500.96933476 295.84998288 496.96910965 296.35645803 492.96781921 296.85656738 C490.84836633 297.12267189 488.72963151 297.39373611 486.61112976 297.66729736 C476.98508885 298.90620896 467.35045041 300.04875905 457.70683289 301.14044189 C456.90463318 301.23176392 456.10243347 301.32308594 455.27592468 301.41717529 C375.23571715 310.50397842 294.70344244 315.71809296 214.20683289 318.45294189 C213.05354492 318.49245972 211.90025696 318.53197754 210.71202087 318.57269287 C195.04078368 319.09391866 179.38611742 319.23093825 163.70683289 319.14044189 C163.65802979 319.98202347 163.60922668 320.82360504 163.5589447 321.69068909 C162.37846072 341.91901285 161.01799283 362.12487814 159.45683289 382.32794189 C159.23652009 385.2009502 159.01699098 388.07401828 158.79740906 390.94708252 C158.27682508 397.7523172 157.75350844 404.55733867 157.22900486 411.36227226 C156.83545263 416.46876067 156.44284082 421.57532033 156.05107117 426.6819458 C155.97070901 427.72941026 155.97070901 427.72941026 155.88872337 428.79803562 C155.78008345 430.21412518 155.67144533 431.63021487 155.56280899 433.0463047 C154.80975205 442.86125976 154.0554833 452.67612063 153.29862976 462.49078369 C153.04016057 465.84275266 152.78169293 469.19472174 152.52323914 472.54669189 C152.45650623 473.41215448 152.38977333 474.27761707 152.32101822 475.1693058 C151.21226603 489.5517993 150.10908853 503.93471736 149.00771767 518.31777763 C148.95319544 519.02979395 148.8986732 519.74181026 148.84249878 520.47540283 C148.7875424 521.19309404 148.73258602 521.91078526 148.6759643 522.65022469 C147.94336777 532.21661408 147.20962267 541.78291544 146.4758234 551.34921265 C145.85744329 559.41152428 145.24000587 567.47390706 144.6237362 575.53638029 C144.19589232 581.13255993 143.76686748 586.72864832 143.33700389 592.32467318 C143.08640373 595.58751782 142.8364743 598.85041135 142.5875988 602.11338806 C141.41611071 617.46813433 140.15114388 632.80882565 138.70683289 648.14044189 C139.88085663 648.12751099 141.05488037 648.11458008 142.26448059 648.10125732 C157.88380189 647.94738185 173.4764815 648.56251284 189.07914734 649.20245361 C192.20745229 649.32999816 195.33588969 649.4477918 198.46488953 649.5569458 C254.99165838 651.53950866 254.99165838 651.53950866 274.65995789 672.19122314 C281.08442909 679.78991493 284.52800826 688.36737385 284.08573914 698.38262939 C282.57407859 709.38502472 276.96919422 717.83231394 268.51933289 724.82794189 C253.74650738 735.60811186 237.01316931 739.3302245 219.05619812 739.25396729 C217.67897331 739.25418633 217.67897331 739.25418633 216.27392578 739.25440979 C213.2710678 739.25371901 210.26827364 739.24596608 207.26542664 739.23809814 C205.17078688 739.236231 203.07614669 739.23480849 200.98150635 739.23381042 C195.49233272 739.23000863 190.00318592 739.22019849 184.51402283 739.20910645 C178.90316633 739.19884188 173.29230546 739.19430203 167.68144226 739.18927002 C156.68989407 739.17857396 145.69836572 739.16152586 134.70683289 739.14044189 C134.71453705 739.96590515 134.72224121 740.79136841 134.73017883 741.6418457 C134.73617096 742.72387268 134.74216309 743.80589966 134.74833679 744.92071533 C134.75989304 746.53016022 134.75989304 746.53016022 134.77168274 748.17211914 C134.53341437 759.07819492 128.63984473 767.52081841 121.08183289 774.82794189 C113.43504092 781.15432007 104.83986427 784.07450787 94.93730164 783.61309814 C84.6726076 782.11125053 76.36959834 777.02431917 69.70683289 769.14044189 C64.84431615 761.38260917 61.59968172 753.63799424 61.66777039 744.42559814 C61.67341003 743.43567871 61.67904968 742.44575928 61.68486023 741.42584229 C61.69211121 740.67166016 61.69936218 739.91747803 61.70683289 739.14044189 C60.55663666 739.14932434 59.40644043 739.15820679 58.22138977 739.1673584 C47.30767339 739.24893821 36.39401999 739.30864218 25.4800663 739.34769058 C19.87095417 739.36844156 14.26209091 739.39652725 8.65312195 739.44219971 C3.22602822 739.48610761 -2.20082825 739.50967252 -7.62808609 739.51995087 C-9.68423312 739.52726246 -11.74036923 739.54153646 -13.79641342 739.56336212 C-29.49618128 739.72318049 -45.8553103 739.1329927 -59.91816711 731.26544189 C-60.5729303 730.91739502 -61.22769348 730.56934814 -61.90229797 730.21075439 C-71.70273784 724.89062039 -81.36145844 717.73995803 -85.62519836 707.01544189 C-87.68523356 698.14885766 -87.96931151 688.13643505 -83.66816711 679.95294189 C-82.59289477 678.31502704 -81.47093524 676.70627648 -80.29316711 675.14044189 C-79.83683899 674.48946533 -79.38051086 673.83848877 -78.91035461 673.16778564 C-69.08531108 660.39522906 -51.45516529 654.11265782 -36.09541321 651.62188721 C-32.09778483 651.11570234 -28.11946532 650.83694372 -24.09785461 650.64044189 C-23.32068085 650.60010834 -22.54350708 650.55977478 -21.74278259 650.51821899 C-19.21808398 650.38855207 -16.69316815 650.26407043 -14.16816711 650.14044189 C-12.86794617 650.07557587 -12.86794617 650.07557587 -11.54145813 650.00939941 C11.87375556 648.84294894 35.25715067 647.9150642 58.70683289 648.14044189 C58.37683289 647.48044189 58.04683289 646.82044189 57.70683289 646.14044189 C57.51810297 644.58757533 57.38247107 643.02809935 57.27372742 641.46759033 C57.20327713 640.48769135 57.13282684 639.50779236 57.0602417 638.49819946 C56.98744492 637.42623322 56.91464813 636.35426697 56.83964539 635.24981689 C56.76052414 634.13603668 56.68140289 633.02225647 56.59988403 631.87472534 C56.42948743 629.47113467 56.26095651 627.06741118 56.09407043 624.66357422 C55.65241013 618.30886729 55.19602283 611.95521205 54.74198914 605.60137939 C54.65209213 604.33786652 54.56219513 603.07435364 54.46957397 601.77255249 C53.77432272 592.01703307 53.04566876 582.26482789 52.26933289 572.51544189 C52.21230194 571.79682983 52.155271 571.07821777 52.09651184 570.33782959 C51.26953618 559.93952197 50.41093822 549.54384497 49.55058289 539.14825439 C47.3651138 512.72379124 45.23080707 486.29848705 43.30131531 459.8538208 C43.13836295 457.62123235 42.9753571 455.38864781 42.81230164 453.15606689 C42.6871241 451.44204178 42.6871241 451.44204178 42.55941772 449.69338989 C41.78943941 439.18998007 40.99434338 428.68853554 40.19511414 418.18731689 C40.12885645 417.31657909 40.06259876 416.44584129 39.99433327 415.5487175 C39.3949726 407.67411792 38.7946349 399.79959303 38.19294739 391.9251709 C37.4682684 382.43995552 36.74726647 372.9544783 36.03337097 363.46844482 C35.82011036 360.63635264 35.60499857 357.8044116 35.3881073 354.97259521 C35.0959968 351.15652651 34.8111712 347.33993379 34.52714539 343.52325439 C34.40060074 341.88899002 34.40060074 341.88899002 34.27149963 340.22171021 C33.75589418 333.18268583 33.61388912 326.19738185 33.70683289 319.14044189 C32.42727722 319.14406738 31.14772156 319.14769287 29.82939148 319.15142822 C-46.31064869 319.30214017 -122.47931391 314.34192657 -198.29316711 307.64044189 C-199.1145517 307.5680983 -199.93593628 307.4957547 -200.7822113 307.42121887 C-232.12232348 304.65927063 -263.44102379 301.58483372 -294.63911438 297.49493408 C-297.42191791 297.1317966 -300.2060849 296.78058375 -302.99043274 296.42950439 C-312.12449409 295.25534118 -321.18669221 293.88697308 -330.22285461 292.10137939 C-331.03307571 291.94218018 -331.84329681 291.78298096 -332.67807007 291.61895752 C-352.62733729 287.51978045 -371.61638145 276.59718189 -383.54316711 259.82794189 C-390.35494091 248.82860224 -391.82894376 237.88034325 -390.29316711 225.14044189 C-387.04884538 211.729582 -377.55131063 200.69197305 -366.29316711 193.14044189 C-353.26882241 185.39195549 -339.21919411 180.0119725 -323.90328312 180.01739407 C-322.03269406 180.01440749 -322.03269406 180.01440749 -320.12431532 180.01136059 C-318.7536022 180.01421307 -317.38288926 180.01715865 -316.01217651 180.02018738 C-314.54595561 180.01975104 -313.07973478 180.01887498 -311.61351436 180.01759821 C-307.59316267 180.01536553 -303.57283769 180.01935775 -299.5524894 180.02437627 C-295.21378527 180.0286982 -290.87508263 180.02723311 -286.53637695 180.026474 C-279.02214769 180.02594987 -271.50792711 180.02908509 -263.99370003 180.03471184 C-253.1294137 180.04284185 -242.26513158 180.0454436 -231.40084254 180.04669983 C-213.7738839 180.04888798 -196.14692988 180.05554167 -178.51997375 180.06500244 C-161.39790368 180.07418266 -144.27583486 180.08126052 -127.15376282 180.08551025 C-125.57042676 180.08590434 -125.57042676 180.08590434 -123.95510412 180.08630639 C-118.65963734 180.08761143 -113.36417056 180.08887514 -108.06870377 180.09011829 C-64.14352168 180.10048354 -20.21834464 180.11809545 23.70683289 180.14044189 C23.70379654 179.06239288 23.70076019 177.98434387 23.69763184 176.87362671 C23.69517528 175.43408215 23.69279382 173.99453746 23.69047546 172.55499268 C23.68718609 171.49366875 23.68718609 171.49366875 23.68383026 170.41090393 C23.63379797 128.85721516 29.67855538 77.10703496 57.70683289 44.14044189 C58.31655945 43.31802002 58.92628601 42.49559814 59.55448914 41.64825439 C62.64392983 38.04857939 66.40256716 35.791986 70.34355164 33.20294189 C73.10357089 30.79419781 73.1857128 29.64780038 73.70683289 26.14044189 C72.6906337 26.14932434 71.67443451 26.15820679 70.62744141 26.1673584 C61.04885175 26.24845925 51.47033178 26.3084145 41.89147663 26.34769058 C36.96690876 26.36856174 32.04261814 26.39687085 27.11820984 26.44219971 C22.36549341 26.48567417 17.6130436 26.50958255 12.86014366 26.51995087 C11.04723603 26.52733936 9.23434292 26.54176744 7.42154884 26.56336212 C4.88131348 26.59241776 2.34217851 26.59639706 -0.19819641 26.59454346 C-0.94698059 26.60892456 -1.69576477 26.62330566 -2.46723938 26.63812256 C-7.37113642 26.59942633 -9.84378409 25.61786208 -13.29316711 22.14044189 C-16.30936625 17.64823042 -16.05156367 12.33658465 -15.29316711 7.14044189 C-11.70263883 0.25303447 -7.09228561 -0.00749856 0 0 Z " fill="${aircraftColor}" transform="translate(413.2931671142578,75.85955810546875)"/>
        </svg>
      </div>
    `,
    className: "aircraft-icon",
    iconSize: [iconWidth, iconHeight],
    iconAnchor: [iconWidth/2, iconHeight/2],
    popupAnchor: [0, -iconHeight/2],
  })
}

// Update the AircraftIconStyles component to enhance the styling
const AircraftIconStyles = () => {
  return (
    <style jsx global>{`
      .aircraft-icon {
        background: transparent !important;
        border: none;
        cursor: pointer;
      }
      .aircraft-icon .aircraft-wrapper {
        transition: all 0.3s ease;
        filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
      }
      .aircraft-icon:hover .aircraft-wrapper {
        filter: drop-shadow(3px 3px 8px rgba(0, 0, 0, 0.5)) brightness(1.1);
        z-index: 1000;
      }
      .aircraft-icon svg {
        background: transparent !important;
      }
    `}
    </style>
  )
}

// Map layer options
const mapLayers = {
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    // Using a different satellite provider that doesn't require subdomains
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 19,
  },
}

// Component to recenter map
function MapCenterControl({ center }: { center: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])

  return null
}

// Component to change the map layer
function MapLayerControl({ activeLayer, onChange }: { activeLayer: string; onChange: (layer: string) => void }) {
  const map = useMap()

  useEffect(() => {
    // This effect runs when the activeLayer changes
    const layer = mapLayers[activeLayer as keyof typeof mapLayers]
    if (layer) {
      // We would update the layer here if we had a reference to it
      // For now, the parent component handles recreating the TileLayer
    }
  }, [activeLayer, map])

  return null
}

interface FlightTrackingMapProps {
  className?: string
}

export function FlightTrackingMap({ className }: FlightTrackingMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(() => {
    // Try to get school location from localStorage first
    const savedSchoolLocation = localStorage.getItem('schoolLocation')
    if (savedSchoolLocation) {
      try {
        const { latitude, longitude } = JSON.parse(savedSchoolLocation)
        return [latitude, longitude]
      } catch (e) {
        console.error('Error parsing saved school location:', e)
      }
    }
    // Fallback to Seattle only if no school location is available
    return [47.6062, -122.3321]
  })
  const [mapZoom, setMapZoom] = useState(12)
  const [activeMapLayer, setActiveMapLayer] = useState<string>("street")
  const [activeFlights, setActiveFlights] = useState<any[]>([])
  const [todaysFlights, setTodaysFlights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFlight, setSelectedFlight] = useState<any | null>(null)
  const [planeData, setPlaneData] = useState<any | null>(null)
  const [showTimeDialog, setShowTimeDialog] = useState(false)
  const [tachTime, setTachTime] = useState("")
  const [hobbsTime, setHobbsTime] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("In Flight")
  const [trackingData, setTrackingData] = useState<any | null>(null)
  const [activeTrackingIds, setActiveTrackingIds] = useState<string[]>([])
  const [isStartingFlight, setIsStartingFlight] = useState(false)
  const [schoolData, setSchoolData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [openPopupId, setOpenPopupId] = useState<string | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const geocodedCoordinatesRef = useRef<{ latitude: number; longitude: number } | null>(null)
  const lastFocusUpdateRef = useRef<number>(0)
  const [planeInfoCache, setPlaneInfoCache] = useState<{ [key: string]: any }>({})
  const router = useRouter()

  // Fix Leaflet icon issue on client side
  useEffect(() => {
    fixLeafletIcon()
  }, [])

  // Debounce function
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  // Geocode address to get coordinates
  const geocodeAddress = async (address: any) => {
    try {
      // Check if we already have coordinates for this address
      if (geocodedCoordinatesRef.current) {
        console.log('Using cached coordinates:', geocodedCoordinatesRef.current)
        return geocodedCoordinatesRef.current
      }

      // Format address with more specific details
      const addressString = `${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`
      console.log('Geocoding address:', addressString)
      
      // Add a delay to respect rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Flight School Dashboard/1.0'
          }
        }
      )
      
      if (!response.ok) {
        console.error('Geocoding request failed:', response.status)
        return null
      }
      
      const data = await response.json()
      console.log('Geocoding response:', data)
      
      if (data && data[0]) {
        const coordinates = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        }
        console.log('Found coordinates:', coordinates)
        geocodedCoordinatesRef.current = coordinates
        return coordinates
      }
      
      // If no results found, try with just the city and state
      console.log('No results found with full address, trying city and state only')
      const cityStateString = `${address.city}, ${address.state}`
      const cityStateResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityStateString)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Flight School Dashboard/1.0'
          }
        }
      )
      
      if (!cityStateResponse.ok) {
        console.error('City/State geocoding request failed:', cityStateResponse.status)
        return null
      }
      
      const cityStateData = await cityStateResponse.json()
      console.log('City/State geocoding response:', cityStateData)
      
      if (cityStateData && cityStateData[0]) {
        const coordinates = {
          latitude: parseFloat(cityStateData[0].lat),
          longitude: parseFloat(cityStateData[0].lon)
        }
        console.log('Found coordinates from city/state:', coordinates)
        geocodedCoordinatesRef.current = coordinates
        return coordinates
      }
      
      console.log('No coordinates found')
      return null
    } catch (err) {
      console.error("Error geocoding address:", err)
      return null
    }
  }

  // Fetch school data
  const fetchSchoolData = async () => {
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token || !apiKey) {
        console.log('Missing required auth data')
        return
      }

      console.log('Fetching school data for ID:', schoolId)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch school data: ${response.status}`)
      }

      const data = await response.json()
      console.log('Received school data:', data.school)
      const school = data.school
      
      // Geocode the address
      if (school.address) {
        console.log('School address found:', school.address)
        const coordinates = await geocodeAddress(school.address)
        if (coordinates) {
          school.address = {
            ...school.address,
            ...coordinates
          }
          console.log('Updated school address with coordinates:', school.address)
        } else {
          console.log('Failed to geocode address')
        }
      } else {
        console.log('No address found in school data')
      }
      
      setSchoolData(school)
      setIsLoading(false)
    } catch (err) {
      console.error("Error fetching school data:", err)
      setIsLoading(false)
    }
  }

  // Load school data on mount
  useEffect(() => {
    fetchSchoolData()
  }, [])

  // Update map focus based on active flights or school location
  const updateMapFocus = useCallback(() => {
    if (!mapRef.current || isLoading) return

    const activeFlights = trackingData?.filter((flight: any) => 
      flight.tracking && flight.tracking.length > 0
    ) || []

    console.log('updateMapFocus - Active flights:', activeFlights.length)
    console.log('updateMapFocus - School data available:', !!schoolData?.address?.latitude)

    // Prioritize active flights over school location
    if (activeFlights.length > 0) {
      if (activeFlights.length === 1) {
        // Single active flight - center on it with animation
        const flight = activeFlights[0]
        const latestPosition = flight.tracking[flight.tracking.length - 1]
        console.log('Centering on single active flight:', latestPosition)
        mapRef.current.flyTo([latestPosition.latitude, latestPosition.longitude], 14, {
          duration: 1.5
        })
      } else {
        // Multiple active flights - fit all in view with animation
        const bounds = L.latLngBounds(activeFlights.map((flight: any) => {
          const latestPosition = flight.tracking[flight.tracking.length - 1]
          return [latestPosition.latitude, latestPosition.longitude]
        }))
        console.log('Fitting bounds for multiple active flights:', bounds)
        mapRef.current.flyToBounds(bounds, {
          padding: [50, 50],
          duration: 1.5
        })
      }
    } else if (schoolData?.address?.latitude && schoolData?.address?.longitude) {
      // No active flights - center on school with animation
      console.log('No active flights, centering on school:', schoolData.address)
      // Save school location for future use
      localStorage.setItem('schoolLocation', JSON.stringify({
        latitude: schoolData.address.latitude,
        longitude: schoolData.address.longitude
      }))
      mapRef.current.flyTo([schoolData.address.latitude, schoolData.address.longitude], 12, {
        duration: 1.5
      })
    }
  }, [trackingData, schoolData, isLoading])

  // Update map focus when tracking data or school data changes
  useEffect(() => {
    if (!isLoading) {
      // Add a small delay to ensure tracking data has been processed
      const timeoutId = setTimeout(() => {
        updateMapFocus()
      }, 500)
      
      return () => clearTimeout(timeoutId)
    }
  }, [trackingData, schoolData, isLoading, updateMapFocus])

  // Load tracking data from localStorage on mount
  useEffect(() => {
    const savedTrackingData = localStorage.getItem('trackingData')
    if (savedTrackingData) {
      try {
        setTrackingData(JSON.parse(savedTrackingData))
      } catch (err) {
        console.error('Error parsing saved tracking data:', err)
      }
    }
  }, [])

  // Save tracking data to localStorage when it changes
  useEffect(() => {
    if (trackingData) {
      localStorage.setItem('trackingData', JSON.stringify(trackingData))
    }
  }, [trackingData])

  const fetchTodaysFlights = async () => {
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token || !apiKey) {
        console.error("Missing required authentication:", { schoolId: !!schoolId, token: !!token, apiKey: !!apiKey })
        throw new Error("Missing required authentication")
      }

      const now = new Date()
      const today = now.toISOString().split('T')[0]
      console.log('Fetching flights for date:', today)
      
      // Try both endpoints to ensure we get the data
      const url = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight-logs/today`
      console.log('Fetching flights from URL:', url)
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      console.log('Flight logs response status:', response.status)
      if (!response.ok) {
        throw new Error(`Failed to fetch flights: ${response.status}`)
      }

      const data = await response.json()
      console.log('Flight logs response data:', data)
      
      if (data.flightLogs && Array.isArray(data.flightLogs)) {
        console.log('Setting today\'s flights:', data.flightLogs.length, 'flights found')
        setTodaysFlights(data.flightLogs)
      } else if (Array.isArray(data)) {
        // Handle case where the API returns an array directly
        console.log('Setting today\'s flights (direct array):', data.length, 'flights found')
        setTodaysFlights(data)
      } else {
        console.warn('Unexpected flight logs data structure:', data)
        // Try the alternative endpoint as a fallback
        const altUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight-logs?date=${today}`
        console.log('Trying alternative endpoint:', altUrl)
        
        const altResponse = await fetch(altUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          credentials: 'include'
        })
        
        if (altResponse.ok) {
          const altData = await altResponse.json()
          console.log('Alternative endpoint response:', altData)
          
          if (altData.flightLogs && Array.isArray(altData.flightLogs)) {
            console.log('Setting today\'s flights from alternative endpoint:', altData.flightLogs.length, 'flights found')
            setTodaysFlights(altData.flightLogs)
          } else if (Array.isArray(altData)) {
            console.log('Setting today\'s flights from alternative endpoint (direct array):', altData.length, 'flights found')
            setTodaysFlights(altData)
          } else {
            console.error('Both endpoints returned unexpected data structure')
            setTodaysFlights([])
          }
        } else {
          console.error('Alternative endpoint also failed:', altResponse.status)
          setTodaysFlights([])
        }
      }
    } catch (err) {
      console.error("Error fetching flights:", err)
      setTodaysFlights([])
    }
  }

  // Add useEffect for fetching today's flights
  useEffect(() => {
    console.log('Initial fetch of today\'s flights')
    fetchTodaysFlights()
    
    // Set up polling every 30 seconds
    const interval = setInterval(() => {
      console.log('Polling for flight updates')
      fetchTodaysFlights()
    }, 30000)
    
    return () => clearInterval(interval)
  }, []) // Empty dependency array to run only on mount
  
  // Add a separate useEffect to refetch flights when school data changes
  useEffect(() => {
    if (schoolData) {
      console.log('School data updated, refetching flights')
      fetchTodaysFlights()
    }
  }, [schoolData])

  // Add function to check if flight can be started
  const canStartFlight = (date: string, startTime: string) => {
    // Parse the time string (HH:mm)
    const [hours, minutes] = startTime.split(':').map(Number);
    
    // Create a date object for the flight time
    const flightDate = new Date(date);
    
    // Set the hours and minutes
    flightDate.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    
    // Calculate 30 minutes before flight time
    const thirtyMinutesBefore = new Date(flightDate.getTime() - 30 * 60000);
    
    // Calculate 30 minutes after flight time
    const thirtyMinutesAfter = new Date(flightDate.getTime() + 30 * 60000);
    
    // Log the time calculations for debugging
    console.log('canStartFlight calculation:', {
      flightDate: flightDate.toISOString(),
      now: now.toISOString(),
      thirtyMinutesBefore: thirtyMinutesBefore.toISOString(),
      thirtyMinutesAfter: thirtyMinutesAfter.toISOString(),
      isWithinWindow: now >= thirtyMinutesBefore && now <= thirtyMinutesAfter
    });
    
    // Flight can be started if current time is between 30 minutes before and 30 minutes after the scheduled time
    return now >= thirtyMinutesBefore && now <= thirtyMinutesAfter;
  }

  const handleStartFlight = async (event: React.MouseEvent, flight: any) => {
    event.stopPropagation()
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token || !apiKey) {
        throw new Error("Missing required authentication")
      }

      // First get the plane data
      const planeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${flight.plane_id}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      if (!planeResponse.ok) {
        throw new Error(`Failed to fetch plane data: ${planeResponse.status}`)
      }

      const planeData = await planeResponse.json()
      console.log('Plane data received:', planeData)
      
      // Access the values from the nested plane object
      const plane = planeData.plane
      setPlaneData(plane)
      setSelectedFlight(flight)
      setTachTime(plane?.tach_time?.toString() ?? '0.0')
      setHobbsTime(plane?.hopps_time?.toString() ?? '0.0')
      setSelectedStatus(flight.status)
      setShowTimeDialog(true)
    } catch (err) {
      console.error("Error starting flight:", err)
    }
  }

  const handleConfirmStart = async () => {
    try {
      if (!selectedFlight || !planeData) return

      setIsStartingFlight(true)

      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token || !apiKey) {
        throw new Error("Missing required authentication")
      }

      // Update plane times
      const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${selectedFlight.plane_id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify({
          tach_time: parseFloat(tachTime),
          hopps_time: parseFloat(hobbsTime)
        }),
        credentials: 'include'
      })

      if (!updateResponse.ok) {
        throw new Error(`Failed to update plane times: ${updateResponse.status}`)
      }

      // Update flight log status to "In Flight"
      const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight-logs/${selectedFlight._id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify({
          status: "In Flight"
        }),
        credentials: 'include'
      })

      if (!statusResponse.ok) {
        throw new Error(`Failed to update flight status: ${statusResponse.status}`)
      }

      // Start tracking the flight
      const trackingResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/track`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify({
          tail_number: planeData.registration,
          instructor_id: selectedFlight.instructor_id,
          student_id: selectedFlight.student_id,
          plane_id: selectedFlight.plane_id,
          school_id: schoolId
        }),
        credentials: 'include'
      })

      if (!trackingResponse.ok) {
        throw new Error(`Failed to start flight tracking: ${trackingResponse.status}`)
      }

      const trackingResult = await trackingResponse.json()
      
      // Store tracking ID in localStorage for future use
      if (trackingResult.track && trackingResult.track._id) {
        const trackingId = trackingResult.track._id
        localStorage.setItem(`tracking_${selectedFlight._id}`, trackingId)
        
        // Add to active tracking IDs
        setActiveTrackingIds(prev => [...prev, trackingId])
      }

      // Close dialog and refresh flights
      setShowTimeDialog(false)
      setSelectedFlight(null)
      setPlaneData(null)
      fetchTodaysFlights()

      // Fetch latest tracking data immediately
      await fetchTrackingUpdates()
    } catch (err) {
      console.error("Error confirming flight start:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsStartingFlight(false)
    }
  }

  // Function to fetch tracking updates for all flights
  const fetchTrackingUpdates = async () => {
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token || !apiKey) return

      // Fetch aircraft tracking data for all school planes
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/aircraft-tracking`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch tracking updates: ${response.status}`)
      }

      const data = await response.json()
      console.log('Aircraft tracking response:', data)
      
      // Transform the new response format to match existing tracking data structure
      if (data.active_aircraft && Array.isArray(data.active_aircraft)) {
        const transformedData = data.active_aircraft
          .filter((aircraft: any) => aircraft.tracking_data?.ac?.[0]) // Only include aircraft with valid tracking data
          .map((aircraft: any) => {
            const trackingInfo = aircraft.tracking_data.ac[0] // Get first (and usually only) tracking entry
            
            return {
              _id: aircraft.plane_id,
              tail_number: aircraft.registration,
              plane_id: aircraft.plane_id,
              aircraft_type: aircraft.type,
              aircraft_model: aircraft.aircraftModel,
              tracking: [{
                latitude: trackingInfo.lat,
                longitude: trackingInfo.lon,
                altitude: trackingInfo.alt_baro || trackingInfo.alt_geom || 0,
                heading: trackingInfo.track || 0,
                ground_speed: trackingInfo.gs || 0,
                timestamp: aircraft.last_updated || new Date().toISOString(),
                // Additional ADS-B specific data
                flight: trackingInfo.flight?.trim() || null,
                squawk: trackingInfo.squawk || null,
                vertical_rate: trackingInfo.baro_rate || 0
              }],
              actual_off: aircraft.last_updated,
              // Store additional aircraft info for display
              aircraft_info: {
                type: aircraft.type,
                model: aircraft.aircraftModel,
                status: aircraft.status
              }
            }
          })
        
        console.log('Transformed tracking data:', transformedData)
        setTrackingData(transformedData)
      } else {
        // No active aircraft found
        console.log('No active aircraft with tracking data')
        setTrackingData([])
      }
    } catch (err) {
      console.error("Error fetching tracking updates:", err)
      setTrackingData([]) // Clear tracking data on error
    }
  }

  // Set up dynamic interval to fetch tracking updates
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    const updateWithDynamicInterval = async () => {
      try {
        // Fetch updates first
        await fetchTrackingUpdates()
        
        // Get fresh tracking data from state after the fetch
        // We'll use a small delay to ensure state has updated
        setTimeout(() => {
          const currentTrackingData = trackingData
          const hasActiveAircraft = currentTrackingData && currentTrackingData.length > 0
          const nextInterval = hasActiveAircraft ? 10000 : 30000 // 10s if active aircraft, 30s if none
          
          console.log(`Next update in ${nextInterval/1000}s (${hasActiveAircraft ? 'active aircraft detected' : 'no active aircraft'})`)
          
          // Schedule next update
          interval = setTimeout(updateWithDynamicInterval, nextInterval)
        }, 100) // Small delay to ensure state has updated
      } catch (error) {
        console.error('Error in tracking update cycle:', error)
        // On error, retry in 30 seconds
        interval = setTimeout(updateWithDynamicInterval, 30000)
      }
    }

    // Start the cycle
    updateWithDynamicInterval()

    return () => {
      if (interval) clearTimeout(interval)
    }
  }, []) // Only run once on mount

  // Load active tracking IDs from localStorage on component mount
  useEffect(() => {
    const loadActiveTrackingIds = () => {
      const trackingIds: string[] = []
      
      // Check all localStorage items for tracking IDs
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('tracking_')) {
          const trackingId = localStorage.getItem(key)
          if (trackingId) {
            trackingIds.push(trackingId)
          }
        }
      }
      
      setActiveTrackingIds(trackingIds)
    }
    
    loadActiveTrackingIds()
  }, [])

  // Get current layer configuration
  const currentLayer = mapLayers[activeMapLayer as keyof typeof mapLayers]

  // Add function to format UTC time to local time
  const formatLocalTime = (utcTime: string) => {
    const date = new Date(utcTime)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Add function to fetch plane info
  const fetchPlaneInfo = async (planeId: string) => {
    try {
      // Check cache first
      if (planeInfoCache[planeId]) {
        return planeInfoCache[planeId]
      }

      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token || !apiKey) {
        throw new Error("Missing required authentication")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${planeId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch plane info: ${response.status}`)
      }

      const data = await response.json()
      // Cache the result
      setPlaneInfoCache(prev => ({ ...prev, [planeId]: data.plane }))
      return data.plane
    } catch (err) {
      console.error("Error fetching plane info:", err)
      return null
    }
  }

  // Add effect to fetch plane info for active flights
  useEffect(() => {
    if (trackingData && Array.isArray(trackingData)) {
      trackingData.forEach(flightData => {
        if (flightData.plane_id) {
          fetchPlaneInfo(flightData.plane_id)
        }
      })
    }
  }, [trackingData])

  // Update the map markers to include tracking data if available
  const renderMapMarkers = () => {
    const markers: React.JSX.Element[] = []
    
    if (trackingData && Array.isArray(trackingData)) {
      trackingData.forEach((flightData) => {
        if (flightData.tracking && flightData.tracking.length > 0) {
          // Find matching flight log for additional info
          const flightLog = todaysFlights.find(f => f.plane_reg === flightData.tail_number && f.status === "In Flight")
          const latestPosition = flightData.tracking[flightData.tracking.length - 1]
          const planeInfo = planeInfoCache[flightData.plane_id]
          
          // Validate that we have valid coordinates before creating marker
          if (!latestPosition || 
              latestPosition.latitude === undefined || 
              latestPosition.longitude === undefined ||
              isNaN(latestPosition.latitude) || 
              isNaN(latestPosition.longitude)) {
            console.warn(`Invalid coordinates for flight ${flightData.tail_number}:`, latestPosition)
            return // Skip this marker
          }
          
          // Format departure time if available
          const departureTime = flightData.actual_off ? formatLocalTime(flightData.actual_off) : 'Not departed'
          
          markers.push(
            <Marker
              key={`tracking-${flightData._id}`}
              position={[latestPosition.latitude, latestPosition.longitude]}
              icon={createAircraftIcon(latestPosition.heading, latestPosition.altitude, getAircraftType(flightData)) as any}
              eventHandlers={{
                click: () => {
                  setMapCenter([latestPosition.latitude, latestPosition.longitude])
                  setOpenPopupId(flightData._id)
                },
              }}
            >
              <Popup>
                <div className="p-4 min-w-[280px]">
                  {/* Header with aircraft info and status */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <svg className="h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{flightData.tail_number}</div>
                      <div className="text-sm text-muted-foreground">
                        {flightData.aircraft_info ? `${flightData.aircraft_info.type} ${flightData.aircraft_info.model}` : 'Aircraft'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        Live
                      </span>
                      {latestPosition.flight?.trim() && (
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {latestPosition.flight.trim()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Flight data grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Altitude</div>
                        <div className="text-sm font-semibold">{Number(latestPosition.altitude).toLocaleString()} ft</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Speed</div>
                        <div className="text-sm font-semibold">{latestPosition.ground_speed} kts</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Heading</div>
                        <div className="text-sm font-semibold">{latestPosition.heading}°</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {latestPosition.squawk && (
                        <div>
                          <div className="text-xs text-muted-foreground uppercase tracking-wide">Squawk</div>
                          <div className="text-sm font-semibold">{latestPosition.squawk}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Vertical Rate</div>
                        <div className="text-sm font-semibold">
                          {latestPosition.vertical_rate > 0 ? '↗' : latestPosition.vertical_rate < 0 ? '↘' : '→'} {Math.abs(latestPosition.vertical_rate)} ft/min
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        }
      })
    }
    
    return markers
  }

  // Add function to handle flight card click
  const handleFlightCardClick = (flight: any) => {
    console.log('Flight card clicked:', flight)
    console.log('Tracking data:', trackingData)
    
    if (flight.status === "In Flight" && trackingData) {
      // Find the flight in tracking data by matching the tail number
      const trackedFlight = trackingData.find((f: any) => f.tail_number === flight.plane_reg)
      console.log('Found tracked flight:', trackedFlight)
      
      if (trackedFlight && trackedFlight.tracking && trackedFlight.tracking.length > 0) {
        const latestPosition = trackedFlight.tracking[trackedFlight.tracking.length - 1]
        console.log('Latest position:', latestPosition)
        
        // Validate coordinates before using them
        if (!latestPosition || 
            latestPosition.latitude === undefined || 
            latestPosition.longitude === undefined ||
            isNaN(latestPosition.latitude) || 
            isNaN(latestPosition.longitude)) {
          console.warn(`Invalid coordinates for flight card click ${flight.plane_reg}:`, latestPosition)
          return // Exit early if coordinates are invalid
        }
        
        if (mapRef.current) {
          // Create popup content
          const popupContent = `
            <div class="p-4">
              <div class="flex items-center gap-2 mb-4">
                <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
                <span class="font-bold">${flight.plane_reg}</span>
                <span class="ml-auto bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">In Flight</span>
              </div>
              <div class="space-y-2">
                <div><span class="font-medium">Aircraft:</span> undefined (${flight.plane_reg})</div>
                <div><span class="font-medium">Student:</span> ${flight.student_name}</div>
                <div><span class="font-medium">Instructor:</span> undefined</div>
                <div><span class="font-medium">Altitude:</span> ${latestPosition.altitude} ft</div>
                <div><span class="font-medium">Speed:</span> ${latestPosition.ground_speed} kts</div>
                <div><span class="font-medium">Heading:</span> ${latestPosition.heading}°</div>
                <div><span class="font-medium">Departure:</span> Not departed</div>
                ${flight.estimated_on ? `<div><span class="font-medium">Est. Arrival:</span> ${flight.estimated_on}</div>` : ''}
              </div>
            </div>
          `

          // Create and open popup
          const popup = L.popup()
            .setLatLng([latestPosition.latitude, latestPosition.longitude])
            .setContent(popupContent)
            .openOn(mapRef.current)

          // Fly to the position
          mapRef.current.flyTo([latestPosition.latitude, latestPosition.longitude], 12, {
            duration: 1.5
          })
        }
      }
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
            "X-CSRF-Token": localStorage.getItem("csrfToken") || "",
            "Authorization": `Bearer ${token}`
          },
          credentials: "include"
        })

        if (!response.ok) {
          throw new Error("Not authenticated")
        }

        const data = await response.json()
        console.log('User data received:', JSON.stringify(data, null, 2))
        
        // Store the school ID in localStorage for other components to use
        if (data.user && data.user.school_id) {
          localStorage.setItem("schoolId", data.user.school_id)
          console.log('Stored school ID in localStorage:', data.user.school_id)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Active Flight Tracking</CardTitle>
          <CardDescription>Loading map data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full rounded-md overflow-hidden border relative flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Initializing map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Active Flight Tracking</CardTitle>
          <CardDescription>Real-time location of aircraft currently in flight</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              console.log('Manual refresh triggered')
              fetchTrackingUpdates()
            }}
          >
            Refresh Aircraft
          </Button>
          <Select value={activeMapLayer} onValueChange={setActiveMapLayer}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select map type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="terrain">Terrain Map</SelectItem>
              <SelectItem value="street">Street Map</SelectItem>
              <SelectItem value="satellite">Satellite</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full rounded-md overflow-hidden border relative">
          {typeof window !== "undefined" && (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ 
                height: "100%", 
                width: "100%", 
                zIndex: 0,
                filter: "brightness(0.85) contrast(1.1) saturate(0.9)"
              }}
              scrollWheelZoom={true}
              minZoom={5}
              maxZoom={currentLayer.maxZoom}
              ref={mapRef}
            >
              <TileLayer {...currentLayer as any} />
              <MapCenterControl center={mapCenter} />
              <MapLayerControl activeLayer={activeMapLayer} onChange={setActiveMapLayer} />
              {/* Compact altitude legend in bottom left */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-md px-2 py-1 shadow-sm border z-[1000]">
                <div className="text-[10px] font-medium text-gray-600 mb-1">ALTITUDE</div>
                <div className="flex items-center gap-[1px]">
                  <div className="w-6 h-3 bg-[#FF4444] rounded-l-sm flex items-center justify-center">
                    <span className="text-[8px] text-white font-medium">0</span>
                  </div>
                  <div className="w-6 h-3 bg-[#FF8800] flex items-center justify-center">
                    <span className="text-[8px] text-white font-medium">1K</span>
                  </div>
                  <div className="w-6 h-3 bg-[#FFDD00] flex items-center justify-center">
                    <span className="text-[8px] text-black font-medium">3K</span>
                  </div>
                  <div className="w-6 h-3 bg-[#44FF44] flex items-center justify-center">
                    <span className="text-[8px] text-black font-medium">5K</span>
                  </div>
                  <div className="w-6 h-3 bg-[#0088FF] flex items-center justify-center">
                    <span className="text-[8px] text-white font-medium">10K</span>
                  </div>
                  <div className="w-6 h-3 bg-[#8844FF] rounded-r-sm flex items-center justify-center">
                    <span className="text-[8px] text-white font-medium">20K+</span>
                  </div>
                </div>
              </div>
              <AircraftIconStyles />
              {renderMapMarkers()}
            </MapContainer>
          )}
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {(() => {
            // Show active aircraft from tracking data
            const activeAircraft = trackingData?.filter((aircraft: any) => 
              aircraft.tracking && aircraft.tracking.length > 0
            ) || []

            console.log('Active aircraft for display:', activeAircraft.length)

            if (activeAircraft.length === 0) {
              return (
                <div className="col-span-full flex flex-col items-center justify-center py-4 px-8 text-center border rounded-md bg-muted/50">
                  <Plane className="h-8 w-8 text-muted-foreground mb-2" strokeWidth={1.5} />
                  <h3 className="text-lg font-semibold mb-1">No Active Aircraft</h3>
                  <p className="text-sm text-muted-foreground">
                    There are no aircraft currently being tracked at this time.
                  </p>
                </div>
              );
            }

            return activeAircraft.map((aircraft: any) => {
              const latestPosition = aircraft.tracking[aircraft.tracking.length - 1]
              
              return (
                <Card
                  key={aircraft._id}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-l-green-500"
                  onClick={() => {
                    // Center map on this aircraft
                    if (mapRef.current) {
                      mapRef.current.flyTo([latestPosition.latitude, latestPosition.longitude], 14, {
                        duration: 1.5
                      })
                      setOpenPopupId(aircraft._id)
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Plane className="h-6 w-6 text-primary" strokeWidth={2} />
                        </div>
                        <div className="space-y-1">
                          <div className="font-semibold text-lg">{aircraft.tail_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {aircraft.aircraft_info ? `${aircraft.aircraft_info.type} ${aircraft.aircraft_info.model}` : 'Aircraft'}
                          </div>
                          {latestPosition.flight?.trim() && (
                            <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                              {latestPosition.flight.trim()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800 hover:bg-green-200 font-medium"
                        >
                          ● Live
                        </Badge>
                        <div className="text-right space-y-1">
                          <div className="text-sm font-medium">
                            {Number(latestPosition.altitude).toLocaleString()} ft
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {latestPosition.ground_speed} kts
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {latestPosition.heading}° HDG
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            });
          })()}
        </div>

        <Dialog open={showTimeDialog} onOpenChange={setShowTimeDialog}>
          <DialogContent className="z-[1000]">
            <DialogHeader>
              <DialogTitle>Confirm Aircraft Times</DialogTitle>
              <DialogDescription>
                Please verify or update the current tach and hobbs time for {planeData?.registration}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tach" className="text-right">
                  Tach Time
                </Label>
                <Input
                  id="tach"
                  value={tachTime}
                  onChange={(e) => setTachTime(e.target.value)}
                  className="col-span-3"
                  type="number"
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="hobbs" className="text-right">
                  Hobbs Time
                </Label>
                <Input
                  id="hobbs"
                  value={hobbsTime}
                  onChange={(e) => setHobbsTime(e.target.value)}
                  className="col-span-3"
                  type="number"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTimeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmStart} disabled={isStartingFlight}>
                {isStartingFlight ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Starting Flight...
                  </>
                ) : (
                  'Start Flight'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <style jsx global>{`
          .leaflet-container {
            z-index: 0 !important;
          }
          .leaflet-control {
            z-index: 1 !important;
          }
          .leaflet-pane {
            z-index: 1 !important;
          }
          .leaflet-popup {
            z-index: 2 !important;
          }
        `}</style>
      </CardContent>
    </Card>
  )
}