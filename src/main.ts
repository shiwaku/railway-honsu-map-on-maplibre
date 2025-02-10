import './style.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { useGsiTerrainSource } from 'maplibre-gl-gsi-terrain';
import { Protocol } from 'pmtiles';
// import mapStyle from './std.json';

// addProtocolの設定
let protocol = new Protocol();
maplibregl.addProtocol('pmtiles', (request) => {
    return new Promise((resolve, reject) => {
        const callback = (err: any, data: any) => {
            if (err) {
                reject(err);
            } else {
                resolve({ data });
            }
        };
        protocol.tile(request, callback);
    });
});

// マップの初期化
const map = new maplibregl.Map({
    container: 'map',
    // style: mapStyle as maplibregl.StyleSpecification,
    style: 'https://api.maptiler.com/maps/darkmatter/style.json?key=8o8Ezu2IQFwmEyfnG3N6',
    center: [134.03926, 34.30355],
    zoom: 11.95,
    maxPitch: 85,
    hash: true,
    attributionControl: false,
});

// ズーム・回転
map.addControl(
    new maplibregl.NavigationControl({
        visualizePitch: true,
    })
);

// 現在位置表示
map.addControl(
    new maplibregl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: false,
        },
        fitBoundsOptions: { maxZoom: 18 },
        trackUserLocation: true,
        showUserLocation: true,
    })
);

// スケール表示
map.addControl(
    new maplibregl.ScaleControl({
        maxWidth: 200,
        unit: 'metric',
    })
);

// Attributionを折りたたみ表示
map.addControl(
    new maplibregl.AttributionControl({
        compact: true,
        customAttribution:
            '（<a href="https://twitter.com/shiwaku" target="_blank">X(旧Twitter)</a> | <a href="https://github.com/shiwaku/railway-honsu-map-on-maplibre" target="_blank">GitHub</a>） ',
    })
);

// 3D地形コントロール
map.addControl(
    new maplibregl.TerrainControl({
        source: 'aist-dem',
        exaggeration: 1, // 標高を強調する倍率
    })
);

// 人口色分け用のフィルタ準備
let f1 = [
    'all',
    ['>=', ['to-number', ['get', 'PopT']], 0],
    ['<', ['to-number', ['get', 'PopT']], 10],
] as maplibregl.ExpressionSpecification;
let f2 = [
    'all',
    ['>=', ['to-number', ['get', 'PopT']], 10],
    ['<', ['to-number', ['get', 'PopT']], 20],
] as maplibregl.ExpressionSpecification;
let f3 = [
    'all',
    ['>=', ['to-number', ['get', 'PopT']], 20],
    ['<', ['to-number', ['get', 'PopT']], 40],
] as maplibregl.ExpressionSpecification;
let f4 = [
    'all',
    ['>=', ['to-number', ['get', 'PopT']], 40],
    ['<', ['to-number', ['get', 'PopT']], 60],
] as maplibregl.ExpressionSpecification;
let f5 = [
    'all',
    ['>=', ['to-number', ['get', 'PopT']], 60],
    ['<', ['to-number', ['get', 'PopT']], 80],
] as maplibregl.ExpressionSpecification;
let f6 = [
    'all',
    ['>=', ['to-number', ['get', 'PopT']], 80],
    ['<', ['to-number', ['get', 'PopT']], 1000000],
] as maplibregl.ExpressionSpecification;

// 人口色分け用色の準備
let colors = ['#0000FF', '#00FFFF', '#00FF00', '#FFBF00', '#FF0000', '#CB00CB'];

map.on('load', () => {
    // 産総研 標高タイル生成
    const gsiTerrainSource = useGsiTerrainSource(maplibregl.addProtocol, {
        tileUrl: 'https://tiles.gsj.jp/tiles/elev/mixed/{z}/{y}/{x}.png',
        maxzoom: 17,
        attribution: '<a href="https://gbank.gsj.jp/seamless/elev/">産総研シームレス標高タイル</a>',
    });

    // 産総研 標高タイルソース
    map.addSource('aist-dem', gsiTerrainSource);

    // 産総研 標高タイルセット
    // map.setTerrain({ 'source': 'aist-dem', 'exaggeration': 1 });

    /*
    // 人口集中地区ソース
    map.addSource('did', {
        type: 'vector',
        url: 'pmtiles://https://xs489works.xsrv.jp/pmtiles-data/r2DID/2020_did_ddsw_01-47_JGD2011.pmtiles',
        attribution:
            '<a href="https://www.e-stat.go.jp/gis">政府統計の総合窓口[e-Stat] 人口集中地区（2020年）</a>',
    });

    // 人口集中地区ポリゴンレイヤ
    map.addLayer({
        id: 'did-polygon',
        source: 'did',
        'source-layer': '2020_did_ddsw_0147_JGD2011fgb',
        type: 'fill',
        paint: {
            'fill-color': '#FFD865',
            'fill-opacity': 0.2,
        },
    });
    */

    // 令和2年簡易100mメッシュ人口（全国）ソース
    map.addSource('100m_mesh_pop2020', {
        type: 'vector',
        // url: 'pmtiles://https://xs489works.xsrv.jp/pmtiles-data/100m_mesh_pop2020/100m_mesh_pop2020_v2.pmtiles',
        url: 'pmtiles://https://pmtiles-data.s3.ap-northeast-1.amazonaws.com/100m_mesh_pop2020/100m_mesh_pop2020_v2.pmtiles',
        attribution:
            '<a href="https://gtfs-gis.jp/teikyo/index.html" target="_blank">地域・交通データ研究所 簡易100mメッシュ人口データ(2020年国勢調査ベース)</a>',
    });

    // 令和2年簡易100mメッシュ人口（全国）レイヤ
    map.addLayer({
        id: '100m_mesh_pop2020_fill',
        // type: 'fill-extrusion',
        type: 'fill',
        source: '100m_mesh_pop2020',
        'source-layer': '100m_mesh_pop2020fgb',
        minzoom: 10,
        maxzoom: 23,
        layout: {},
        paint: {
            // 'fill-extrusion-color': [
            'fill-color': [
                'case',
                f1,
                colors[0],
                f2,
                colors[1],
                f3,
                colors[2],
                f4,
                colors[3],
                f5,
                colors[4],
                f6,
                colors[5],
                colors[5],
            ],
            // 'fill-extrusion-height': ['*', ['to-number', ['get', 'PopT']], 10],
            // 'fill-extrusion-opacity': 0.6,
            'fill-opacity': 0.4,
        },
    });

    // 行政区域（ポリゴン）ソース
    map.addSource('pmtiles-gyouseikai', {
        type: 'vector',
        url:
            'pmtiles://' +
            'https://xs489works.xsrv.jp/pmtiles-data/ksj/N03-23_230101_gyouseikai.pmtiles',
        attribution:
            '<a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-v3_1.html">国土数値情報 行政区域データ（令和5年度）</a>',
    });

    // 行政区域ラインレイヤ
    map.addLayer({
        id: 'gyouseikai-line',
        type: 'line',
        source: 'pmtiles-gyouseikai',
        'source-layer': 'N0323_230101_gyouseikai',
        minzoom: 8,
        maxzoom: 18,
        paint: {
            'line-color': 'rgba(255, 255, 255, 1)',
            'line-width': 1,
        },
    });

    // バスルートベクトルタイル
    map.addSource('pmtiles-bus-route', {
        type: 'vector',
        url: 'pmtiles://' + 'https://xs489works.xsrv.jp/pmtiles-data/ksj/N07_22_bus_route.pmtiles',
        attribution:
            '<a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N07-v2_0.html">国土数値情報 バスルートデータ（令和4年度）を加工して作成</a>',
    });

    // バスルートラインレイヤ
    map.addLayer({
        id: 'bus-route-lines-1',
        type: 'line',
        source: 'pmtiles-bus-route',
        'source-layer': 'N07_22_bus_route',
        minzoom: 12,
        maxzoom: 23,
        paint: {
            'line-color': '#007FFF',
            'line-width': 6,
            'line-blur': 5,
        },
    });

    // バスルートラインレイヤ
    map.addLayer({
        id: 'bus-route-lines-2',
        type: 'line',
        source: 'pmtiles-bus-route',
        'source-layer': 'N07_22_bus_route',
        minzoom: 12,
        maxzoom: 23,
        paint: {
            'line-color': 'rgba(101,178,255,1)',
            'line-width': 3,
            'line-blur': 2.5,
        },
    });

    // バスルートラインレイヤ
    map.addLayer({
        id: 'bus-route-lines-3',
        type: 'line',
        source: 'pmtiles-bus-route',
        'source-layer': 'N07_22_bus_route',
        minzoom: 12,
        maxzoom: 23,
        paint: {
            'line-color': 'rgba(255, 255, 255, 1)',
            'line-width': 1,
        },
    });

    // バス停留所ベクトルタイル
    map.addSource('pmtiles-bus-stop', {
        type: 'vector',
        url: 'pmtiles://' + 'https://xs489works.xsrv.jp/pmtiles-data/ksj/P11_22_bus_stop.pmtiles',
        attribution:
            '<a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P11-v3_0.html">国土数値情報 バス停留所データ（令和4年度）を加工して作成</a>',
    });

    // バス停留所ポイントレイヤ
    map.addLayer({
        id: 'bus-stop-points-1',
        type: 'circle',
        source: 'pmtiles-bus-stop',
        'source-layer': 'P11_22_bus_stop',
        minzoom: 12,
        maxzoom: 23,
        paint: {
            'circle-color': '#65B2FF',
            'circle-radius': 5,
            'circle-blur': 0,
            'circle-opacity': 0.7,
        },
    });

    // 路線別・区間別運行本数ソース
    map.addSource('rosen-kukan-honsu', {
        type: 'vector',
        url: 'pmtiles://https://shiwaku.github.io/gtfs-gis-railway-honsu-pmtiles/PMTiles/unkohonsu2024_rosen_kukan.pmtiles',
        attribution:
            '<a href="https://gtfs-gis.jp/railway_honsu/index.html">全国鉄道運行本数データ(2024年版) CC-BY 4.0、ODbL（西澤明）</a>',
    });

    // 路線別・区間別運行本数ラインレイヤ
    map.addLayer({
        id: 'railway-honsu-line-1',
        type: 'line',
        source: 'rosen-kukan-honsu',
        'source-layer': 'unkohonsu2024_rosen_kukanfgb',
        layout: {
            'line-join': 'round',
            'line-cap': 'round',
        },
        paint: {
            'line-width': [
                'step',
                ['to-number', ['get', '順方向運行本数2024']],
                1, // 0 以上 10 未満
                10,
                2, // 10 以上 25 未満
                25,
                4, // 25 以上 50 未満
                50,
                8, // 50 以上 100 未満
                100,
                12, // 100 以上 200 未満
                200,
                16, // 200 以上
            ],
            'line-color': '#00FF00',
            'line-blur': 3,
            'line-opacity': 0.4,
        },
    });

    // 路線別・区間別運行本数ラインレイヤ
    map.addLayer({
        id: 'railway-honsu-line-2',
        type: 'line',
        source: 'rosen-kukan-honsu',
        'source-layer': 'unkohonsu2024_rosen_kukanfgb',
        layout: {
            'line-join': 'round',
            'line-cap': 'round',
        },
        paint: {
            'line-width': [
                'step',
                ['to-number', ['get', '順方向運行本数2024']],
                0.5, // 0 以上 10 未満
                10,
                1, // 10 以上 25 未満
                25,
                2, // 25 以上 50 未満
                50,
                4, // 50 以上 100 未満
                100,
                6, // 100 以上 200 未満
                200,
                8, // 200 以上
            ],
            'line-color': '#00FF00',
            'line-blur': 3,
            'line-opacity': 0.4,
        },
    });

    // 路線別・区間別運行本数ラインレイヤ
    map.addLayer({
        id: 'railway-honsu-line-3',
        type: 'line',
        source: 'rosen-kukan-honsu',
        'source-layer': 'unkohonsu2024_rosen_kukanfgb',
        layout: {
            'line-join': 'round',
            'line-cap': 'round',
        },
        paint: {
            'line-width': 1,
            'line-color': '#ffffff',
            'line-blur': 0,
            'line-opacity': 1,
        },
    });

    // 路線別・区間別運行本数ラベルレイヤ
    map.addLayer({
        id: 'railway-honsu-label',
        type: 'symbol',
        source: 'rosen-kukan-honsu',
        'source-layer': 'unkohonsu2024_rosen_kukanfgb',
        minzoom: 10,
        maxzoom: 23,
        layout: {
            'symbol-placement': 'line-center', // ラベルを線に沿って配置
            'text-rotation-alignment': 'map', // ラベルの回転を線に沿って調整
            'text-field': ['concat', ['get', '路線名'], ['get', '順方向運行本数2024'], '本'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 14,
            'text-offset': [0, -0.5],
        },
        paint: {
            'text-color': 'rgba(255, 255, 255, 1)',
            'text-halo-blur': 0.8,
            'text-halo-color': 'rgba(0, 0, 0, 1)',
            'text-halo-width': 1,
        },
    });

    // 鉄道駅ラインソース
    map.addSource('ksj-station', {
        type: 'vector',
        url: 'pmtiles://https://shiworks.xsrv.jp/pmtiles-data/gtfs-gis/railway_honsu/N02-22_Station.pmtiles',
        attribution:
            '<a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-2022.html">国土数値情報 鉄道データ(2022年度)</a>',
    });

    // 鉄道駅ラインレイヤ
    map.addLayer({
        id: 'station-line',
        type: 'line',
        source: 'ksj-station',
        'source-layer': 'N0222_Stationfgb',
        minzoom: 10,
        maxzoom: 23,
        layout: {
            'line-join': 'miter',
            'line-cap': 'butt',
        },
        paint: {
            'line-width': 15,
            'line-color': '#00FF00',
            'line-opacity': 0.7,
        },
    });

    // 鉄道駅ラベレイヤ
    map.addLayer({
        id: 'station-label',
        type: 'symbol',
        source: 'ksj-station',
        'source-layer': 'N0222_Stationfgb',
        minzoom: 10,
        maxzoom: 23,
        layout: {
            'symbol-placement': 'line-center', // ラベルを線に沿って配置
            'text-rotation-alignment': 'map', // ラベルの回転を線に沿って調整
            'text-field': ['get', 'N02_005'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-offset': [0, 0],
        },
        paint: {
            'text-color': 'rgba(255, 255, 255, 1)',
            'text-halo-blur': 0.8,
            'text-halo-color': 'rgba(0, 0, 0, 1)',
            'text-halo-width': 1,
        },
    });

    // 役場ソース
    map.addSource('town-hall', {
        type: 'geojson',
        data: 'https://xs489works.xsrv.jp/pmtiles-data/ksj/P05-22_01_47_town_hall_add_cityname.geojson',
        attribution:
            '<a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P05-v3_0.html">国土数値情報 市町村役場（令和4年度）</a>',
    });

    // 役場ポイントレイヤ
    // 外側の黒い円
    map.addLayer({
        id: 'town-hall-points-outer-1',
        type: 'circle',
        source: 'town-hall',
        minzoom: 9,
        maxzoom: 12,
        paint: {
            'circle-color': 'rgba(0, 0, 0, 1)',
            'circle-radius': 5.5,
            'circle-blur': 0,
            'circle-opacity': 1,
        },
    });

    // 内側の白い円
    map.addLayer({
        id: 'town-hall-points-inner-1',
        type: 'circle',
        source: 'town-hall',
        minzoom: 9,
        maxzoom: 12,
        paint: {
            'circle-color': 'rgba(255, 255, 255, 1)',
            'circle-radius': 4,
            'circle-blur': 0,
            'circle-opacity': 1,
        },
    });

    // 外側の黒い円
    map.addLayer({
        id: 'town-hall-points-outer-2',
        type: 'circle',
        source: 'town-hall',
        minzoom: 9,
        maxzoom: 12,
        paint: {
            'circle-color': 'rgba(0, 0, 0, 1)',
            'circle-radius': 3,
            'circle-blur': 0,
            'circle-opacity': 1,
        },
    });

    // 内側の白い円
    map.addLayer({
        id: 'town-hall-points-inner-2',
        type: 'circle',
        source: 'town-hall',
        minzoom: 9,
        maxzoom: 12,
        paint: {
            'circle-color': 'rgba(255, 255, 255, 1)',
            'circle-radius': 2.25,
            'circle-blur': 0,
            'circle-opacity': 1,
        },
    });

    // 役場ラベルレイヤ
    map.addLayer({
        id: 'town-hall-labels-1',
        type: 'symbol',
        source: 'town-hall',
        minzoom: 9,
        maxzoom: 12,
        layout: {
            'text-field': ['get', 'city_name'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 14,
            'text-anchor': 'center',
            'text-justify': 'center',
            'text-offset': [0, -1.0],
            'text-allow-overlap': true,
        },
        paint: {
            'text-color': 'rgba(0, 0, 0, 1)',
            'text-halo-color': 'rgba(255, 255, 255, 1)',
            'text-halo-width': 1,
        },
    });

    // 役場ラベルレイヤ
    map.addLayer({
        id: 'town-hall-labels-2',
        type: 'symbol',
        source: 'town-hall',
        minzoom: 12,
        maxzoom: 18,
        layout: {
            'text-field': ['get', 'city_name'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 22,
            'text-anchor': 'center',
            'text-justify': 'center',
            'text-offset': [0, -1.0],
            'text-allow-overlap': true,
        },
        paint: {
            'text-color': 'rgba(0, 0, 0, 1)',
            'text-halo-color': 'rgba(255, 255, 255, 1)',
            'text-halo-width': 2,
        },
    });
});

// クリック時のポップアップ表示
map.on('click', 'railway-honsu-line-1', (e) => {
    var lng = e.lngLat.lng;
    var lat = e.lngLat.lat;
    if (!e.features || e.features.length === 0) {
        console.error('No features found');
        return;
    }
    var jigyosyamei = e.features[0].properties['事業者名'];
    var rosenmei = e.features[0].properties['路線名'];
    var in_honsu = e.features[0].properties['順方向運行本数2024'];
    var out_honsu = e.features[0].properties['逆方向運行本数2024'];

    new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(
            '事業者名: ' +
                jigyosyamei +
                '<br>' +
                '路線名: ' +
                rosenmei +
                '<br>' +
                '順方向運行本数: ' +
                in_honsu +
                '<br>' +
                '逆方向運行本数: ' +
                out_honsu +
                '<br>' +
                '<a href=https://www.google.com/maps?q=' +
                lat +
                ',' +
                lng +
                "&hl=ja' target='_blank'>🌎Google Maps</a>" +
                ' ' +
                '<a href=https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' +
                lat +
                ',' +
                lng +
                "&hl=ja' target='_blank'>📷Street View</a>"
        )
        .addTo(map);
});

// クリック時のポップアップ表示
map.on('click', '100m_mesh_pop2020_fill', (e) => {
    var lng = e.lngLat.lng;
    var lat = e.lngLat.lat;

    if (e.features && e.features.length > 0) {
        var MESH_CODE = e.features[0].properties['MESH_CODE'];
        var PopT = e.features[0].properties['PopT'];
        var Pop0_14 = e.features[0].properties['Pop0_14'];
        var Pop15_64 = e.features[0].properties['Pop15_64'];
        var Pop65over = e.features[0].properties['Pop65over'];
        var Pop75over = e.features[0].properties['Pop75over'];
        var Pop85over = e.features[0].properties['Pop85over'];
    }

    new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(
            '<div style="solid #000; font-size: 1.2em; color: #0065CB;"><strong>簡易100mメッシュ人口</strong></div>' +
                '<div style="solid #000; font-size: 1.2em; color: #0065CB;"><strong>(2020年国勢調査ベース)</strong></div>' +
                '<table class="pop-info">' +
                '<tr>' +
                '<th></th>' +
                '<th></th>' +
                '</tr>' +
                '<tr>' +
                '<td>メッシュコード：</td>' +
                '<td><b>' +
                MESH_CODE +
                '</b></td>' +
                '</tr>' +
                '<tr>' +
                '<td>総人口：</td>' +
                '<td><b>' +
                PopT +
                '人' +
                '</b></td>' +
                '</tr>' +
                '<tr>' +
                '<td>0～14歳人口：</td>' +
                '<td><b>' +
                Pop0_14 +
                '人' +
                '</b></td>' +
                '</tr>' +
                '<tr>' +
                '<td>15～64歳人口：</td>' +
                '<td><b>' +
                Pop15_64 +
                '人' +
                '</b></td>' +
                '</tr>' +
                '<tr>' +
                '<td>65歳以上人口：</td>' +
                '<td><b>' +
                Pop65over +
                '人' +
                '</b></td>' +
                '</tr>' +
                '<tr>' +
                '<td>75歳以上人口：</td>' +
                '<td><b>' +
                Pop75over +
                '人' +
                '</b></td>' +
                '</tr>' +
                '<tr>' +
                '<td>85歳以上人口：</td>' +
                '<td><b>' +
                Pop85over +
                '人' +
                '</b></td>' +
                '</tr>' +
                '</table>' +
                '※このデータは、簡易な方法で人口を按分したものであり、当該100mメッシュの実際の人口を示しているものではありません。' +
                '<br>' +
                '<a href=https://www.google.com/maps?q=' +
                lat +
                ',' +
                lng +
                "&hl=ja' target='_blank'>🌎Google Maps</a>" +
                ' ' +
                '<a href=https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=' +
                lat +
                ',' +
                lng +
                "&hl=ja' target='_blank'>📷Street View</a>"
        )
        .addTo(map);
});
