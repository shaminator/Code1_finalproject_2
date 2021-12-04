uniform sampler2D uTexture;
uniform float uTime;

varying vec2 vUv;


void main()
{
    vec2 adjustedUv = vUv;
    adjustedUv.y += uTime * 0.002 ;

    vec4 textureColor = texture2D(uTexture, adjustedUv * 3.0);
    gl_FragColor = textureColor;
}