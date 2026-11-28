import { brotliDecompressSync } from "node:zlib";
import { createRequire } from "module";
import { readFile, writeFile } from "node:fs/promises";
// ../../packages/fonts/src/advance-table.ts
/**
* Returns the advance width of one code point in font units.
* Characters missing from the table count as `defaultAdvance` (full width, 02-layout 2.1).
*/
function advanceOf(table, codePoint) {
	const { ranges } = table;
	let low = 0;
	let high = ranges.length - 1;
	while (low <= high) {
		const middle = low + high >>> 1;
		const range = ranges[middle];
		if (range === void 0) break;
		const [first, last, advance] = range;
		if (codePoint < first) high = middle - 1;
		else if (codePoint > last) low = middle + 1;
		else return advance;
	}
	return table.defaultAdvance;
}
// ../../packages/fonts/src/block-font.ts
/**
* The default block font: D2Coding Regular without Han ideographs (ADR-0034).
* Bold has the same advances, so this table also measures bold text (02-layout 2.1).
*/
var blockFont = {
	familyName: "AriadneNSD Mono",
	weight: 400,
	files: {
		ttf: "assets/ariadne-nsd-mono-regular.ttf",
		woff2: "assets/ariadne-nsd-mono-regular.woff2"
	},
	advances: {
		unitsPerEm: 1e3,
		defaultAdvance: 1e3,
		ranges: [
			[
				32,
				126,
				500
			],
			[
				160,
				447,
				500
			],
			[
				884,
				885,
				500
			],
			[
				890,
				890,
				500
			],
			[
				894,
				894,
				500
			],
			[
				900,
				906,
				500
			],
			[
				908,
				908,
				500
			],
			[
				910,
				929,
				500
			],
			[
				931,
				974,
				500
			],
			[
				976,
				993,
				500
			],
			[
				1008,
				1119,
				500
			],
			[
				1122,
				1123,
				500
			],
			[
				1138,
				1141,
				500
			],
			[
				1168,
				1179,
				500
			],
			[
				1186,
				1189,
				500
			],
			[
				1194,
				1203,
				500
			],
			[
				1210,
				1211,
				500
			],
			[
				1216,
				1220,
				500
			],
			[
				1223,
				1224,
				500
			],
			[
				1227,
				1228,
				500
			],
			[
				1231,
				1273,
				500
			],
			[
				8192,
				8203,
				500
			],
			[
				8208,
				8227,
				500
			],
			[
				8229,
				8230,
				500
			],
			[
				8239,
				8247,
				500
			],
			[
				8249,
				8255,
				500
			],
			[
				8258,
				8258,
				500
			],
			[
				8260,
				8265,
				500
			],
			[
				8267,
				8270,
				500
			],
			[
				8273,
				8273,
				500
			],
			[
				8287,
				8287,
				500
			],
			[
				8352,
				8373,
				500
			],
			[
				8376,
				8377,
				500
			],
			[
				8592,
				8723,
				500
			],
			[
				8725,
				8725,
				500
			],
			[
				8727,
				8736,
				500
			],
			[
				8738,
				8739,
				500
			],
			[
				8741,
				8750,
				500
			],
			[
				8756,
				8765,
				500
			],
			[
				8769,
				8811,
				500
			],
			[
				8813,
				8843,
				500
			],
			[
				8845,
				8869,
				500
			],
			[
				8882,
				8885,
				500
			],
			[
				8888,
				8888,
				500
			],
			[
				8891,
				8892,
				500
			],
			[
				8898,
				8902,
				500
			],
			[
				8909,
				8913,
				500
			],
			[
				8922,
				8937,
				500
			],
			[
				8942,
				8943,
				500
			],
			[
				9472,
				9599,
				500
			],
			[
				9632,
				9724,
				500
			],
			[
				9727,
				9727,
				500
			]
		]
	}
};
// ../../packages/fonts/src/generated/screen-slices.ts
/** The screen font in slices (ADR-0040), as written by the build. */
var screenSliceData = [
	{
		file: "ariadne-nsd-mono-regular.00.woff2",
		count: 803,
		unicodeRange: "U+20-7E, U+A0-FF, U+2000-200B, U+2010-2023, U+2025-2026, U+202F-2037, U+2039-203F, U+2042, U+2044-2049, U+204B-204E, U+2051, U+205F, U+20A0-20B5, U+20B8-20B9, U+2190-2213, U+2215, U+2217-2220, U+2222-2223, U+2225-222E, U+2234-223D, U+2241-226B, U+226D-228B, U+228D-22A5, U+22B2-22B5, U+22B8, U+22BB-22BC, U+22C2-22C6, U+22CD-22D1, U+22DA-22E9, U+22EE-22EF, U+2500-257F, U+25A0-25FF, U+27DC, U+29A3"
	},
	{
		file: "ariadne-nsd-mono-regular.01.woff2",
		count: 484,
		unicodeRange: "U+100-1BF, U+374-375, U+37A, U+37E, U+384-38A, U+38C, U+38E-3A1, U+3A3-3CE, U+3D0-3E1, U+3F0-45F, U+462-463, U+472-475, U+490-49B, U+4A2-4A5, U+4AA-4B3, U+4BA-4BB, U+4C0-4C4, U+4C7-4C8, U+4CB-4CC, U+4CF-4F9"
	},
	{
		file: "ariadne-nsd-mono-regular.02.woff2",
		count: 391,
		unicodeRange: "U+3000-3003, U+3008-3019, U+301C, U+301E-3020, U+3036, U+3041-3093, U+30A1-30F6, U+30FC, U+3131-318E, U+FF01-FF5E, U+FFE0-FFE3, U+FFE5-FFE6"
	},
	{
		file: "ariadne-nsd-mono-regular.03.woff2",
		count: 100,
		chars: "다이는에로의기은가을고지서그를어하인한니리록면스자정문나시으트아일블요사테보것과만있안도모라바장대음않드파름입수메없키저세제두와글구크번선결해들습주상위더림같마게접화전용호소너적처영래목내때함른토표항"
	},
	{
		file: "ariadne-nsd-mono-regular.04.woff2",
		count: 100,
		chars: "우할출줄집개여작조타설역치편었계프택확열했르분본부단되명버텍러실합새려배레뒤넣무코판경동원점진쓰남램데칙꼴색태금웹미오성운쪽식까브페추링펴거션검물예말터포규방알야든곳순된따유령커받린비공읽체둘양준폭변"
	},
	{
		file: "ariadne-nsd-mono-regular.05.woff2",
		count: 100,
		chars: "붙중째델간머갈옮헤뉴디직꾸행칸형달반법셸빈첫후임았천립맞답누플각네못감클범럼돌필능연험속통던언올긴맨종값건셋패힌백관께웃끝릭둔류업복앞생찾히움뷰폴환풀채노력뀌창견막차친며질등엇승앱약품워겹람현삽강느놓"
	},
	{
		file: "ariadne-nsd-mono-regular.06.woff2",
		count: 100,
		chars: "밋신져골초발씩축빌절툴묻국쳐좋띠므큰늘엔밖묶쓴왼섯옛뜻참별흐향재최불온싸써펼굵난캔벨침콘톱닫겠근겨매렸잘석떻렌폰날먼밝취였짜컬닭길료볼힘됨높베넷청넘란탭김산꾼케례담칠롭회눈탕튼권잡존졌휴랐릴빼팔억듭쳤"
	},
	{
		file: "ariadne-nsd-mono-regular.07.woff2",
		count: 100,
		chars: "틀꿔둡뿐쓸깨낸찍뀐옆측많빠꿀떤렇짓씁넓짐짧살꿈듣또삭곱벤술꿨셀좁괄응즈렬손외싶컨왔겼켜숫혀런논루깥됩울증교닌빗옵맡걸독둠딩띄킨롤앤좌눌애갱얼카왜줌눠럽봐잠컴픽허완휠긋당압귀덧벽심흉님깐잃탐격꺼뜨웠율혼"
	},
	{
		file: "ariadne-nsd-mono-regular.08.woff2",
		count: 100,
		chars: "황략광몇씀극끌섞퍼싣춰낼멈밀봄릅봅쉽큼템끼널련쇄쯤층티팅듈셈싼궁닿덟랑삼익흑낮떨론혔홍눔퀵굴끄될뺌깊끊락뺀쌓콜틈깁랫숨짝됐슨탈꼭낱룬썼젝짚평폼갖옴틴났똑박쉬싱씬춘춤칭푸냅북센철턱피객급덮떠럿액퀀갑갔듬"
	},
	{
		file: "ariadne-nsd-mono-regular.09.woff2",
		count: 100,
		chars: "렉병옅잰충캐킬헷곧뀜렵릿얹곽딱뮤숏썸훅굳넌닙덜떼퓨끔맵홉깔듦뭐슷즘꼬닝뜰룹망웁잇픈흔뀔돈랜벗뼈앰앵핵꿉낌냄냈댑멍슈칩활획념벌볍뽑얻족줍첩흰걱녕킵흩군늦뜬뤄앙앴엽탁냥덩듯률밤숙왕징캡탄팝폐학힐럴벡빨잊특"
	},
	{
		file: "ariadne-nsd-mono-regular.10.woff2",
		count: 100,
		chars: "효맹몰벼봤샷짤췄횟겸곁납년둥렷몫좀죠죽짠찬턴훑힙괜깝끈낡녹눴딘룸뤘뭉민및솔앨엶윤착찮책핸협닮랬렀밈슬엘웨탓팬흠놀눕딕딸뚱랍밑뺐셨쌀쌍씨옷켰팎껍뀝넉넨득랄롬맥먹멀밍뺍삐샘암엉쟀줘척춥캘켠투팀혹겁겪균낫늬"
	},
	{
		file: "ariadne-nsd-mono-regular.11.woff2",
		count: 100,
		chars: "댄딪떴맙믿뿌얘엄윗육잭즉첨켬킴팩푼갇걷괴끗낀냐덕돕돼뛴뜸뜹뢰릇뭔뺄뻔샀쉼십염월잖잼쥐쫓텐팁풉핑훨휘꼽꽤뉘뉜뉩닐댐띈량룰맷멋뭘섬솟싫쌌썹얀얇욕읍젠즐짙짭쪼챕컫켤쿼큐탑톨퇴풍헥홀훈흘곡껴꼈꼐낄낙댈댔덱뒷뛰"
	},
	{
		file: "ariadne-nsd-mono-regular.12.woff2",
		count: 108,
		chars: "랩럭륭맑몽묘믹밉붉빛쁘섭숍썬악얽엮잦잴줬짬쩌쩔쭉츠컸켓큽텁튀튜튿폄폈헌헛훌갤겉굻깜꺾껐꿰낯넸녀녁눅뉠뉨닥덤돎둬딴땅땔뚜뚫뛸뜀뜁랙랠맸멤묵묾뮬밌밸빔쁜샌섰섹셉셌셔솜쌈쌉앉앗얕엑옳웅잔쟁짰쭙쭸챈챘촉킹탤톡톤튄펌햇헝헬홈훔"
	},
	{
		file: "ariadne-nsd-mono-regular.13.woff2",
		count: 400,
		from: 44034,
		to: 44494
	},
	{
		file: "ariadne-nsd-mono-regular.14.woff2",
		count: 400,
		from: 44495,
		to: 44929
	},
	{
		file: "ariadne-nsd-mono-regular.15.woff2",
		count: 400,
		from: 44930,
		to: 45387
	},
	{
		file: "ariadne-nsd-mono-regular.16.woff2",
		count: 400,
		from: 45388,
		to: 45835
	},
	{
		file: "ariadne-nsd-mono-regular.17.woff2",
		count: 400,
		from: 45836,
		to: 46273
	},
	{
		file: "ariadne-nsd-mono-regular.18.woff2",
		count: 400,
		from: 46274,
		to: 46704
	},
	{
		file: "ariadne-nsd-mono-regular.19.woff2",
		count: 400,
		from: 46705,
		to: 47155
	},
	{
		file: "ariadne-nsd-mono-regular.20.woff2",
		count: 400,
		from: 47156,
		to: 47606
	},
	{
		file: "ariadne-nsd-mono-regular.21.woff2",
		count: 400,
		from: 47610,
		to: 48041
	},
	{
		file: "ariadne-nsd-mono-regular.22.woff2",
		count: 400,
		from: 48042,
		to: 48491
	},
	{
		file: "ariadne-nsd-mono-regular.23.woff2",
		count: 400,
		from: 48492,
		to: 48916
	},
	{
		file: "ariadne-nsd-mono-regular.24.woff2",
		count: 400,
		from: 48917,
		to: 49322
	},
	{
		file: "ariadne-nsd-mono-regular.25.woff2",
		count: 400,
		from: 49323,
		to: 49774
	},
	{
		file: "ariadne-nsd-mono-regular.26.woff2",
		count: 400,
		from: 49775,
		to: 50206
	},
	{
		file: "ariadne-nsd-mono-regular.27.woff2",
		count: 400,
		from: 50207,
		to: 50658
	},
	{
		file: "ariadne-nsd-mono-regular.28.woff2",
		count: 400,
		from: 50659,
		to: 51143
	},
	{
		file: "ariadne-nsd-mono-regular.29.woff2",
		count: 400,
		from: 51144,
		to: 51574
	},
	{
		file: "ariadne-nsd-mono-regular.30.woff2",
		count: 400,
		from: 51575,
		to: 52003
	},
	{
		file: "ariadne-nsd-mono-regular.31.woff2",
		count: 400,
		from: 52004,
		to: 52429
	},
	{
		file: "ariadne-nsd-mono-regular.32.woff2",
		count: 400,
		from: 52430,
		to: 52855
	},
	{
		file: "ariadne-nsd-mono-regular.33.woff2",
		count: 400,
		from: 52857,
		to: 53278
	},
	{
		file: "ariadne-nsd-mono-regular.34.woff2",
		count: 400,
		from: 53279,
		to: 53717
	},
	{
		file: "ariadne-nsd-mono-regular.35.woff2",
		count: 400,
		from: 53718,
		to: 54143
	},
	{
		file: "ariadne-nsd-mono-regular.36.woff2",
		count: 400,
		from: 54144,
		to: 54568
	},
	{
		file: "ariadne-nsd-mono-regular.37.woff2",
		count: 564,
		from: 54569,
		to: 55203
	}
];
// ../../packages/fonts/src/screen-slices.ts
var hex = (code) => code.toString(16).toUpperCase();
/** The unicode-range of code points in increasing order, runs joined (`U+AC00-AC02, U+AC05`). */
function unicodeRangeOf(codes) {
	const runs = [];
	for (const code of codes) {
		const last = runs.at(-1);
		if (last?.[1] === code - 1) last[1] = code;
		else runs.push([code, code]);
	}
	return runs.map(([first, end]) => first === end ? `U+${hex(first)}` : `U+${hex(first)}-${hex(end)}`).join(", ");
}
/** The slices with their unicode-range, slice 0 first. */
function screenSlicesOf(data) {
	const common = /* @__PURE__ */ new Set();
	for (const slice of data) if ("chars" in slice) for (const char of slice.chars) common.add(char.codePointAt(0) ?? 0);
	return data.map((slice) => {
		let unicodeRange;
		if ("unicodeRange" in slice) unicodeRange = slice.unicodeRange;
		else if ("chars" in slice) unicodeRange = unicodeRangeOf(Array.from(slice.chars, (char) => char.codePointAt(0) ?? 0).sort((a, b) => a - b));
		else {
			const codes = [];
			for (let code = slice.from; code <= slice.to; code += 1) if (!common.has(code)) codes.push(code);
			unicodeRange = unicodeRangeOf(codes);
		}
		return {
			file: slice.file,
			unicodeRange,
			count: slice.count
		};
	});
}
screenSlicesOf(screenSliceData);
// ../../packages/fonts/src/sfnt.ts
/** Reads the table directory of an uncompressed sfnt font. Throws on a malformed font (a bug upstream). */
function readSfnt(bytes) {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const flavor = view.getUint32(0);
	const numTables = view.getUint16(4);
	const tables = [];
	for (let index = 0; index < numTables; index += 1) {
		const record = 12 + index * 16;
		const tag = tagToString(view.getUint32(record));
		const offset = view.getUint32(record + 8);
		const length = view.getUint32(record + 12);
		if (offset + length > bytes.byteLength) throw new Error(`sfnt table ${tag} runs past the end of the font`);
		tables.push({
			tag,
			data: bytes.subarray(offset, offset + length)
		});
	}
	tables.sort((a, b) => compareTags(a.tag, b.tag));
	return {
		flavor,
		tables
	};
}
/**
* The OpenType table checksum: the sum of the data as big-endian uint32 words,
* with the last word zero-padded.
*/
function tableChecksum(data) {
	let sum = 0;
	const fullWords = data.byteLength >>> 2;
	const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
	for (let word = 0; word < fullWords; word += 1) sum = sum + view.getUint32(word * 4) >>> 0;
	const rest = data.byteLength & 3;
	if (rest > 0) {
		let last = 0;
		for (let index = 0; index < 4; index += 1) last = last << 8 | (index < rest ? data[fullWords * 4 + index] ?? 0 : 0);
		sum = sum + (last >>> 0) >>> 0;
	}
	return sum;
}
/** Converts a four-letter table tag to its uint32 value. */
function tagToNumber(tag) {
	let value = 0;
	for (let index = 0; index < 4; index += 1) value = value << 8 | tag.charCodeAt(index) & 255;
	return value >>> 0;
}
function tagToString(value) {
	return String.fromCharCode(value >>> 24 & 255, value >>> 16 & 255, value >>> 8 & 255, value & 255);
}
function compareTags(a, b) {
	return tagToNumber(a) - tagToNumber(b);
}
/** Rounds a byte length up to the next multiple of four (sfnt and WOFF table alignment). */
function padded4(length) {
	return length + 3 & -4;
}
// ../../node_modules/.pnpm/fflate@0.8.3/node_modules/fflate/esm/index.mjs
var require = createRequire("/");
var _a;
try {
	_a = require("worker_threads"), _a.Worker, _a.isMarkedAsUntransferable;
} catch (e) {}
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	4,
	4,
	4,
	4,
	5,
	5,
	5,
	5,
	0,
	0,
	0,
	0
]);
var fdeb = new u8([
	0,
	0,
	0,
	0,
	1,
	1,
	2,
	2,
	3,
	3,
	4,
	4,
	5,
	5,
	6,
	6,
	7,
	7,
	8,
	8,
	9,
	9,
	10,
	10,
	11,
	11,
	12,
	12,
	13,
	13,
	0,
	0
]);
var clim = new u8([
	16,
	17,
	18,
	0,
	8,
	7,
	9,
	6,
	10,
	5,
	11,
	4,
	12,
	3,
	13,
	2,
	14,
	1,
	15
]);
var freb = function(eb, start) {
	var b = new u16(31);
	for (var i = 0; i < 31; ++i) b[i] = start += 1 << eb[i - 1];
	var r = new i32(b[30]);
	for (var i = 1; i < 30; ++i) for (var j = b[i]; j < b[i + 1]; ++j) r[j] = j - b[i] << 5 | i;
	return {
		b,
		r
	};
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
_b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (var i = 0; i < 32768; ++i) {
	var x = (i & 43690) >> 1 | (i & 21845) << 1;
	x = (x & 52428) >> 2 | (x & 13107) << 2;
	x = (x & 61680) >> 4 | (x & 3855) << 4;
	rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var hMap = (function(cd, mb, r) {
	var s = cd.length;
	var i = 0;
	var l = new u16(mb);
	for (; i < s; ++i) if (cd[i]) ++l[cd[i] - 1];
	var le = new u16(mb);
	for (i = 1; i < mb; ++i) le[i] = le[i - 1] + l[i - 1] << 1;
	var co;
	if (r) {
		co = new u16(1 << mb);
		var rvb = 15 - mb;
		for (i = 0; i < s; ++i) if (cd[i]) {
			var sv = i << 4 | cd[i];
			var r_1 = mb - cd[i];
			var v = le[cd[i] - 1]++ << r_1;
			for (var m = v | (1 << r_1) - 1; v <= m; ++v) co[rev[v] >> rvb] = sv;
		}
	} else {
		co = new u16(s);
		for (i = 0; i < s; ++i) if (cd[i]) co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
	}
	return co;
});
var flt = new u8(288);
for (var i = 0; i < 144; ++i) flt[i] = 8;
for (var i = 144; i < 256; ++i) flt[i] = 9;
for (var i = 256; i < 280; ++i) flt[i] = 7;
for (var i = 280; i < 288; ++i) flt[i] = 8;
var fdt = new u8(32);
for (var i = 0; i < 32; ++i) fdt[i] = 5;
var flm = /*#__PURE__*/ hMap(flt, 9, 0);
var fdm = /*#__PURE__*/ hMap(fdt, 5, 0);
var shft = function(p) {
	return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
	if (s == null || s < 0) s = 0;
	if (e == null || e > v.length) e = v.length;
	return new u8(v.subarray(s, e));
};
var wbits = function(d, p, v) {
	v <<= p & 7;
	var o = p / 8 | 0;
	d[o] |= v;
	d[o + 1] |= v >> 8;
};
var wbits16 = function(d, p, v) {
	v <<= p & 7;
	var o = p / 8 | 0;
	d[o] |= v;
	d[o + 1] |= v >> 8;
	d[o + 2] |= v >> 16;
};
var hTree = function(d, mb) {
	var t = [];
	for (var i = 0; i < d.length; ++i) if (d[i]) t.push({
		s: i,
		f: d[i]
	});
	var s = t.length;
	var t2 = t.slice();
	if (!s) return {
		t: et,
		l: 0
	};
	if (s == 1) {
		var v = new u8(t[0].s + 1);
		v[t[0].s] = 1;
		return {
			t: v,
			l: 1
		};
	}
	t.sort(function(a, b) {
		return a.f - b.f;
	});
	t.push({
		s: -1,
		f: 25001
	});
	var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
	t[0] = {
		s: -1,
		f: l.f + r.f,
		l,
		r
	};
	while (i1 != s - 1) {
		l = t[t[i0].f < t[i2].f ? i0++ : i2++];
		r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
		t[i1++] = {
			s: -1,
			f: l.f + r.f,
			l,
			r
		};
	}
	var maxSym = t2[0].s;
	for (var i = 1; i < s; ++i) if (t2[i].s > maxSym) maxSym = t2[i].s;
	var tr = new u16(maxSym + 1);
	var mbt = ln(t[i1 - 1], tr, 0);
	if (mbt > mb) {
		var i = 0, dt = 0;
		var lft = mbt - mb, cst = 1 << lft;
		t2.sort(function(a, b) {
			return tr[b.s] - tr[a.s] || a.f - b.f;
		});
		for (; i < s; ++i) {
			var i2_1 = t2[i].s;
			if (tr[i2_1] > mb) {
				dt += cst - (1 << mbt - tr[i2_1]);
				tr[i2_1] = mb;
			} else break;
		}
		dt >>= lft;
		while (dt > 0) {
			var i2_2 = t2[i].s;
			if (tr[i2_2] < mb) dt -= 1 << mb - tr[i2_2]++ - 1;
			else ++i;
		}
		for (; i >= 0 && dt; --i) {
			var i2_3 = t2[i].s;
			if (tr[i2_3] == mb) {
				--tr[i2_3];
				++dt;
			}
		}
		mbt = mb;
	}
	return {
		t: new u8(tr),
		l: mbt
	};
};
var ln = function(n, l, d) {
	return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
};
var lc = function(c) {
	var s = c.length;
	while (s && !c[--s]);
	var cl = new u16(++s);
	var cli = 0, cln = c[0], cls = 1;
	var w = function(v) {
		cl[cli++] = v;
	};
	for (var i = 1; i <= s; ++i) if (c[i] == cln && i != s) ++cls;
	else {
		if (!cln && cls > 2) {
			for (; cls > 138; cls -= 138) w(32754);
			if (cls > 2) {
				w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
				cls = 0;
			}
		} else if (cls > 3) {
			w(cln), --cls;
			for (; cls > 6; cls -= 6) w(8304);
			if (cls > 2) w(cls - 3 << 5 | 8208), cls = 0;
		}
		while (cls--) w(cln);
		cls = 1;
		cln = c[i];
	}
	return {
		c: cl.subarray(0, cli),
		n: s
	};
};
var clen = function(cf, cl) {
	var l = 0;
	for (var i = 0; i < cl.length; ++i) l += cf[i] * cl[i];
	return l;
};
var wfblk = function(out, pos, dat) {
	var s = dat.length;
	var o = shft(pos + 2);
	out[o] = s & 255;
	out[o + 1] = s >> 8;
	out[o + 2] = out[o] ^ 255;
	out[o + 3] = out[o + 1] ^ 255;
	for (var i = 0; i < s; ++i) out[o + i + 4] = dat[i];
	return (o + 4 + s) * 8;
};
var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
	wbits(out, p++, final);
	++lf[256];
	var _a = hTree(lf, 15), dlt = _a.t, mlb = _a.l;
	var _b = hTree(df, 15), ddt = _b.t, mdb = _b.l;
	var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
	var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
	var lcfreq = new u16(19);
	for (var i = 0; i < lclt.length; ++i) ++lcfreq[lclt[i] & 31];
	for (var i = 0; i < lcdt.length; ++i) ++lcfreq[lcdt[i] & 31];
	var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
	var nlcc = 19;
	for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc);
	var flen = bl + 5 << 3;
	var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
	var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
	if (bs >= 0 && flen <= ftlen && flen <= dtlen) return wfblk(out, p, dat.subarray(bs, bs + bl));
	var lm, ll, dm, dl;
	wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
	if (dtlen < ftlen) {
		lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
		var llm = hMap(lct, mlcb, 0);
		wbits(out, p, nlc - 257);
		wbits(out, p + 5, ndc - 1);
		wbits(out, p + 10, nlcc - 4);
		p += 14;
		for (var i = 0; i < nlcc; ++i) wbits(out, p + 3 * i, lct[clim[i]]);
		p += 3 * nlcc;
		var lcts = [lclt, lcdt];
		for (var it = 0; it < 2; ++it) {
			var clct = lcts[it];
			for (var i = 0; i < clct.length; ++i) {
				var len = clct[i] & 31;
				wbits(out, p, llm[len]), p += lct[len];
				if (len > 15) wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
			}
		}
	} else lm = flm, ll = flt, dm = fdm, dl = fdt;
	for (var i = 0; i < li; ++i) {
		var sym = syms[i];
		if (sym > 255) {
			var len = sym >> 18 & 31;
			wbits16(out, p, lm[len + 257]), p += ll[len + 257];
			if (len > 7) wbits(out, p, sym >> 23 & 31), p += fleb[len];
			var dst = sym & 31;
			wbits16(out, p, dm[dst]), p += dl[dst];
			if (dst > 3) wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
		} else wbits16(out, p, lm[sym]), p += ll[sym];
	}
	wbits16(out, p, lm[256]);
	return p + ll[256];
};
var deo = /*#__PURE__*/ new i32([
	65540,
	131080,
	131088,
	131104,
	262176,
	1048704,
	1048832,
	2114560,
	2117632
]);
var et = /*#__PURE__*/ new u8(0);
var dflt = function(dat, lvl, plvl, pre, post, st) {
	var s = st.z || dat.length;
	var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
	var w = o.subarray(pre, o.length - post);
	var lst = st.l;
	var pos = (st.r || 0) & 7;
	if (lvl) {
		if (pos) w[0] = st.r >> 3;
		var opt = deo[lvl - 1];
		var n = opt >> 13, c = opt & 8191;
		var msk_1 = (1 << plvl) - 1;
		var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
		var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
		var hsh = function(i) {
			return (dat[i] ^ dat[i + 1] << bs1_1 ^ dat[i + 2] << bs2_1) & msk_1;
		};
		var syms = new i32(25e3);
		var lf = new u16(288), df = new u16(32);
		var lc_1 = 0, eb = 0, i = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
		for (; i + 2 < s; ++i) {
			var hv = hsh(i);
			var imod = i & 32767, pimod = head[hv];
			prev[imod] = pimod;
			head[hv] = imod;
			if (wi <= i) {
				var rem = s - i;
				if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
					pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
					li = lc_1 = eb = 0, bs = i;
					for (var j = 0; j < 286; ++j) lf[j] = 0;
					for (var j = 0; j < 30; ++j) df[j] = 0;
				}
				var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
				if (rem > 2 && hv == hsh(i - dif)) {
					var maxn = Math.min(n, rem) - 1;
					var maxd = Math.min(32767, i);
					var ml = Math.min(258, rem);
					while (dif <= maxd && --ch_1 && imod != pimod) {
						if (dat[i + l] == dat[i + l - dif]) {
							var nl = 0;
							for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl);
							if (nl > l) {
								l = nl, d = dif;
								if (nl > maxn) break;
								var mmd = Math.min(dif, nl - 2);
								var md = 0;
								for (var j = 0; j < mmd; ++j) {
									var ti = i - dif + j & 32767;
									var cd = ti - prev[ti] & 32767;
									if (cd > md) md = cd, pimod = ti;
								}
							}
						}
						imod = pimod, pimod = prev[imod];
						dif += imod - pimod & 32767;
					}
				}
				if (d) {
					syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
					var lin = revfl[l] & 31, din = revfd[d] & 31;
					eb += fleb[lin] + fdeb[din];
					++lf[257 + lin];
					++df[din];
					wi = i + l;
					++lc_1;
				} else {
					syms[li++] = dat[i];
					++lf[dat[i]];
				}
			}
		}
		for (i = Math.max(i, wi); i < s; ++i) {
			syms[li++] = dat[i];
			++lf[dat[i]];
		}
		pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
		if (!lst) {
			st.r = pos & 7 | w[pos / 8 | 0] << 3;
			pos -= 7;
			st.h = head, st.p = prev, st.i = i, st.w = wi;
		}
	} else {
		for (var i = st.w || 0; i < s + lst; i += 65535) {
			var e = i + 65535;
			if (e >= s) {
				w[pos / 8 | 0] = lst;
				e = s;
			}
			pos = wfblk(w, pos + 1, dat.subarray(i, e));
		}
		st.i = s;
	}
	return slc(o, 0, pre + shft(pos) + post);
};
var adler = function() {
	var a = 1, b = 0;
	return {
		p: function(d) {
			var n = a, m = b;
			var l = d.length | 0;
			for (var i = 0; i != l;) {
				var e = Math.min(i + 2655, l);
				for (; i < e; ++i) m += n += d[i];
				n = (n & 65535) + 15 * (n >> 16), m = (m & 65535) + 15 * (m >> 16);
			}
			a = n, b = m;
		},
		d: function() {
			a %= 65521, b %= 65521;
			return (a & 255) << 24 | (a & 65280) << 8 | (b & 255) << 8 | b >> 8;
		}
	};
};
var dopt = function(dat, opt, pre, post, st) {
	if (!st) {
		st = { l: 1 };
		if (opt.dictionary) {
			var dict = opt.dictionary.subarray(-32768);
			var newDat = new u8(dict.length + dat.length);
			newDat.set(dict);
			newDat.set(dat, dict.length);
			dat = newDat;
			st.w = dict.length;
		}
	}
	return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
};
var wbytes = function(d, b, v) {
	for (; v; ++b) d[b] = v, v >>>= 8;
};
var zlh = function(c, o) {
	var lv = o.level, fl = lv == 0 ? 0 : lv < 6 ? 1 : lv == 9 ? 3 : 2;
	c[0] = 120, c[1] = fl << 6 | (o.dictionary && 32);
	c[1] |= 31 - (c[0] << 8 | c[1]) % 31;
	if (o.dictionary) {
		var h = adler();
		h.p(o.dictionary);
		wbytes(c, 2, h.d());
	}
};
/**
* Compress data with Zlib
* @param data The data to compress
* @param opts The compression options
* @returns The zlib-compressed version of the data
*/
function zlibSync(data, opts) {
	if (!opts) opts = {};
	var a = adler();
	a.p(data);
	var d = dopt(data, opts, opts.dictionary ? 6 : 2, 4);
	return zlh(d, opts), wbytes(d, d.length - 4, a.d()), d;
}
var td = typeof TextDecoder != "undefined" && /*#__PURE__*/ new TextDecoder();
try {
	td.decode(et, { stream: true });
} catch (e) {}
// ../../packages/fonts/src/woff.ts
/**
* The zlib settings. Changing them (or the fflate version) changes saved files,
* so both are fixed (ADR-0039, coding guide 12).
*/
var ZLIB_OPTIONS = {
	level: 9,
	mem: 8
};
var WOFF_HEADER_SIZE = 44;
var WOFF_DIRECTORY_ENTRY_SIZE = 20;
var SFNT_HEADER_SIZE = 12;
var SFNT_DIRECTORY_ENTRY_SIZE = 16;
/** Offset of `checkSumAdjustment` in the `head` table. */
var HEAD_CHECKSUM_ADJUSTMENT = 8;
/**
* Wraps an sfnt (TTF) font in WOFF 1.0 (ADR-0039).
* Each table is zlib-compressed unless that would not make it smaller, as the WOFF spec requires.
* There is no metadata or private block. The same input always gives the same bytes (R-FMT-03).
*/
function encodeWoff(sfnt) {
	const { flavor, tables: sourceTables } = readSfnt(sfnt);
	const tables = withChecksumAdjustment(flavor, sourceTables);
	const entries = tables.map((table) => {
		const compressed = zlibSync(table.data, ZLIB_OPTIONS);
		return {
			table,
			stored: compressed.byteLength < table.data.byteLength ? compressed : table.data,
			checksum: checksumForDirectory(table)
		};
	});
	const dataStart = WOFF_HEADER_SIZE + WOFF_DIRECTORY_ENTRY_SIZE * entries.length;
	const totalLength = entries.reduce((sum, entry) => sum + padded4(entry.stored.byteLength), dataStart);
	const totalSfntSize = SFNT_HEADER_SIZE + SFNT_DIRECTORY_ENTRY_SIZE * tables.length + tables.reduce((sum, table) => sum + padded4(table.data.byteLength), 0);
	const out = new Uint8Array(totalLength);
	const view = new DataView(out.buffer);
	view.setUint32(0, tagToNumber("wOFF"));
	view.setUint32(4, flavor);
	view.setUint32(8, totalLength);
	view.setUint16(12, entries.length);
	view.setUint16(14, 0);
	view.setUint32(16, totalSfntSize);
	view.setUint16(20, 1);
	view.setUint16(22, 0);
	let offset = dataStart;
	entries.forEach((entry, index) => {
		const record = WOFF_HEADER_SIZE + index * WOFF_DIRECTORY_ENTRY_SIZE;
		view.setUint32(record, tagToNumber(entry.table.tag));
		view.setUint32(record + 4, offset);
		view.setUint32(record + 8, entry.stored.byteLength);
		view.setUint32(record + 12, entry.table.data.byteLength);
		view.setUint32(record + 16, entry.checksum);
		out.set(entry.stored, offset);
		offset += padded4(entry.stored.byteLength);
	});
	return out;
}
/**
* Sets `head.checkSumAdjustment` for the sfnt a WOFF reader rebuilds (tables in tag order),
* so the decoded font has a valid whole-font checksum whatever the subsetter wrote.
*/
function withChecksumAdjustment(flavor, tables) {
	let sum = tableChecksum(sfntHeader(flavor, tables));
	for (const table of tables) sum = sum + checksumForDirectory(table) >>> 0;
	const adjustment = 2981146554 - sum >>> 0;
	return tables.map((table) => {
		if (table.tag !== "head") return table;
		const data = table.data.slice();
		new DataView(data.buffer).setUint32(HEAD_CHECKSUM_ADJUSTMENT, adjustment);
		return {
			tag: table.tag,
			data
		};
	});
}
/** The table checksum as the directory stores it: for `head`, with `checkSumAdjustment` taken as 0. */
function checksumForDirectory(table) {
	if (table.tag !== "head") return tableChecksum(table.data);
	const data = table.data.slice();
	new DataView(data.buffer).setUint32(HEAD_CHECKSUM_ADJUSTMENT, 0);
	return tableChecksum(data);
}
/** The offset table and table directory of the rebuilt sfnt. */
function sfntHeader(flavor, tables) {
	const count = tables.length;
	const header = new Uint8Array(SFNT_HEADER_SIZE + SFNT_DIRECTORY_ENTRY_SIZE * count);
	const view = new DataView(header.buffer);
	const entrySelector = count > 0 ? Math.floor(Math.log2(count)) : 0;
	const searchRange = 2 ** entrySelector * 16;
	view.setUint32(0, flavor);
	view.setUint16(4, count);
	view.setUint16(6, searchRange);
	view.setUint16(8, entrySelector);
	view.setUint16(10, count * 16 - searchRange);
	let offset = header.byteLength;
	tables.forEach((table, index) => {
		const record = SFNT_HEADER_SIZE + index * SFNT_DIRECTORY_ENTRY_SIZE;
		view.setUint32(record, tagToNumber(table.tag));
		view.setUint32(record + 4, checksumForDirectory(table));
		view.setUint32(record + 8, offset);
		view.setUint32(record + 12, table.data.byteLength);
		offset += padded4(table.data.byteLength);
	});
	return header;
}
// ../../packages/fonts/src/subset.ts
var REQUIRED_FUNCTIONS = [
	"malloc",
	"free",
	"hb_blob_create",
	"hb_blob_destroy",
	"hb_blob_get_data",
	"hb_blob_get_length",
	"hb_face_create",
	"hb_face_destroy",
	"hb_face_reference_blob",
	"hb_set_add",
	"hb_set_clear",
	"hb_set_invert",
	"hb_subset_input_create_or_fail",
	"hb_subset_input_destroy",
	"hb_subset_input_unicode_set",
	"hb_subset_input_set",
	"hb_subset_input_set_flags",
	"hb_subset_or_fail"
];
var HB_MEMORY_MODE_WRITABLE = 2;
var HB_SUBSET_FLAGS_NO_HINTING = 1;
var HB_SUBSET_SETS_DROP_TABLE_TAG = 3;
var HB_SUBSET_SETS_NAME_ID = 4;
var HB_SUBSET_SETS_NAME_LANG_ID = 5;
var HB_SUBSET_SETS_LAYOUT_FEATURE_TAG = 6;
/**
* Layout tables to drop on top of HarfBuzz's defaults: no kerning, no ligatures (02-layout 2.2).
* Widths are summed advances, so the font must not shape text (ADR-0026).
*/
var DROPPED_LAYOUT_TABLES = [
	"GSUB",
	"GPOS",
	"GDEF",
	"kern",
	"morx",
	"mort",
	"kerx"
];
/**
* Instantiates the hb-subset wasm (`harfbuzzjs/dist/harfbuzz-subset.wasm`) and returns a subsetter.
* The caller loads the bytes: `@ariadne-nsd/fonts/node` in Node, `@ariadne-nsd/fonts/browser` in a browser.
*/
async function createSubsetter(wasm) {
	const { WebAssembly } = globalThis;
	const { instance } = await WebAssembly.instantiate(wasm, {});
	return subsetterFromExports(instance.exports);
}
/** Builds a subsetter from an already instantiated hb-subset wasm module's exports. */
function subsetterFromExports(exports) {
	const hb = checkExports(exports);
	if (typeof exports._initialize === "function") exports._initialize();
	const subsetTtf = (ttf, codePoints) => runSubset(hb, ttf, codePoints);
	return {
		subsetTtf,
		subsetToWoff: (ttf, codePoints) => encodeWoff(subsetTtf(ttf, codePoints))
	};
}
function checkExports(exports) {
	const memory = exports.memory;
	if (typeof memory !== "object" || memory === null || !("buffer" in memory)) throw new Error("hb-subset wasm does not export its memory");
	const missing = REQUIRED_FUNCTIONS.filter((name) => typeof exports[name] !== "function");
	if (missing.length > 0) throw new Error(`hb-subset wasm lacks exports: ${missing.join(", ")}`);
	return exports;
}
function runSubset(hb, ttf, codePoints) {
	const fontPointer = hb.malloc(ttf.byteLength);
	if (fontPointer === 0) throw new Error("hb-subset wasm is out of memory");
	new Uint8Array(hb.memory.buffer).set(ttf, fontPointer);
	const blob = hb.hb_blob_create(fontPointer, ttf.byteLength, HB_MEMORY_MODE_WRITABLE, 0, 0);
	const face = hb.hb_face_create(blob, 0);
	hb.hb_blob_destroy(blob);
	const input = hb.hb_subset_input_create_or_fail();
	try {
		if (input === 0) throw new Error("hb_subset_input_create_or_fail failed");
		configureInput(hb, input, codePoints);
		const subsetFace = hb.hb_subset_or_fail(face, input);
		if (subsetFace === 0) throw new Error("hb_subset_or_fail failed: the font is not a valid TTF");
		const result = hb.hb_face_reference_blob(subsetFace);
		const offset = hb.hb_blob_get_data(result, 0);
		const length = hb.hb_blob_get_length(result);
		const bytes = new Uint8Array(hb.memory.buffer).slice(offset, offset + length);
		hb.hb_blob_destroy(result);
		hb.hb_face_destroy(subsetFace);
		return bytes;
	} finally {
		if (input !== 0) hb.hb_subset_input_destroy(input);
		hb.hb_face_destroy(face);
		hb.free(fontPointer);
	}
}
function configureInput(hb, input, codePoints) {
	const unicodes = hb.hb_subset_input_unicode_set(input);
	for (const codePoint of codePoints) hb.hb_set_add(unicodes, codePoint);
	hb.hb_subset_input_set_flags(input, HB_SUBSET_FLAGS_NO_HINTING);
	const dropTables = hb.hb_subset_input_set(input, HB_SUBSET_SETS_DROP_TABLE_TAG);
	for (const tag of DROPPED_LAYOUT_TABLES) hb.hb_set_add(dropTables, tagToNumber(tag));
	hb.hb_set_clear(hb.hb_subset_input_set(input, HB_SUBSET_SETS_LAYOUT_FEATURE_TAG));
	const nameIds = hb.hb_subset_input_set(input, HB_SUBSET_SETS_NAME_ID);
	hb.hb_set_clear(nameIds);
	hb.hb_set_invert(nameIds);
	const nameLanguages = hb.hb_subset_input_set(input, HB_SUBSET_SETS_NAME_LANG_ID);
	hb.hb_set_clear(nameLanguages);
	hb.hb_set_invert(nameLanguages);
}
// ../../packages/fonts/src/glyph-outlines.ts
/** Reads the outlines of a TrueType (`glyf`) font. Throws if a table it needs is missing. */
function readGlyphOutlines(ttf) {
	const { tables } = readSfnt(ttf);
	const table = (tag) => {
		const found = tables.find((candidate) => candidate.tag === tag);
		if (found === void 0) throw new Error(`The font has no ${tag} table`);
		return new DataView(found.data.buffer, found.data.byteOffset, found.data.byteLength);
	};
	const head = table("head");
	const unitsPerEm = head.getUint16(18);
	const isLongLoca = head.getInt16(50) === 1;
	const numGlyphs = table("maxp").getUint16(4);
	const numberOfHMetrics = table("hhea").getUint16(34);
	const hmtx = table("hmtx");
	const loca = table("loca");
	const glyf = table("glyf");
	const cmap = readCmap(table("cmap"));
	const advanceOf = (glyphId) => hmtx.getUint16(Math.min(glyphId, numberOfHMetrics - 1) * 4);
	const rangeOf = (glyphId) => isLongLoca ? [loca.getUint32(glyphId * 4), loca.getUint32(glyphId * 4 + 4)] : [loca.getUint16(glyphId * 2) * 2, loca.getUint16(glyphId * 2 + 2) * 2];
	const points = (glyphId, depth) => {
		if (glyphId >= numGlyphs || depth > 8) return [];
		const [start, end] = rangeOf(glyphId);
		if (end <= start) return [];
		const view = new DataView(glyf.buffer, glyf.byteOffset + start, end - start);
		const contourCount = view.getInt16(0);
		return contourCount >= 0 ? simpleContours(view, contourCount) : compositeContours(view, (child) => points(child, depth + 1));
	};
	const cache = /* @__PURE__ */ new Map();
	const glyphById = (glyphId) => {
		let glyph = cache.get(glyphId);
		if (glyph === void 0) {
			glyph = {
				advance: advanceOf(glyphId),
				commands: points(glyphId, 0).flatMap(contourPath)
			};
			cache.set(glyphId, glyph);
		}
		return glyph;
	};
	return {
		unitsPerEm,
		glyphOf: (codePoint) => {
			const glyphId = cmap(codePoint);
			return glyphId === 0 ? null : glyphById(glyphId);
		},
		notdef: glyphById(0)
	};
}
var ON_CURVE = 1;
var X_SHORT = 2;
var Y_SHORT = 4;
var REPEAT = 8;
var X_SAME_OR_POSITIVE = 16;
var Y_SAME_OR_POSITIVE = 32;
function simpleContours(view, contourCount) {
	const ends = [];
	for (let index = 0; index < contourCount; index += 1) ends.push(view.getUint16(10 + index * 2));
	const pointCount = (ends.at(-1) ?? -1) + 1;
	let at = 10 + contourCount * 2;
	at += 2 + view.getUint16(at);
	const flags = [];
	while (flags.length < pointCount) {
		const flag = view.getUint8(at);
		at += 1;
		flags.push(flag);
		if ((flag & REPEAT) !== 0) {
			const repeat = view.getUint8(at);
			at += 1;
			for (let index = 0; index < repeat; index += 1) flags.push(flag);
		}
	}
	const readAxis = (short, same) => {
		const values = [];
		let value = 0;
		for (const flag of flags.slice(0, pointCount)) {
			if ((flag & short) !== 0) {
				const delta = view.getUint8(at);
				at += 1;
				value += (flag & same) !== 0 ? delta : -delta;
			} else if ((flag & same) === 0) {
				value += view.getInt16(at);
				at += 2;
			}
			values.push(value);
		}
		return values;
	};
	const xs = readAxis(X_SHORT, X_SAME_OR_POSITIVE);
	const ys = readAxis(Y_SHORT, Y_SAME_OR_POSITIVE);
	const contours = [];
	let first = 0;
	for (const last of ends) {
		const contour = [];
		for (let index = first; index <= last; index += 1) contour.push({
			x: xs[index] ?? 0,
			y: ys[index] ?? 0,
			isOnCurve: ((flags[index] ?? 0) & ON_CURVE) !== 0
		});
		contours.push(contour);
		first = last + 1;
	}
	return contours;
}
var ARGS_ARE_WORDS = 1;
var ARGS_ARE_XY = 2;
var HAS_SCALE = 8;
var MORE_COMPONENTS = 32;
var HAS_XY_SCALE = 64;
var HAS_TWO_BY_TWO = 128;
function compositeContours(view, child) {
	const contours = [];
	let at = 10;
	for (;;) {
		const flags = view.getUint16(at);
		const glyphId = view.getUint16(at + 2);
		at += 4;
		let dx;
		let dy;
		if ((flags & ARGS_ARE_WORDS) !== 0) {
			dx = view.getInt16(at);
			dy = view.getInt16(at + 2);
			at += 4;
		} else {
			dx = view.getInt8(at);
			dy = view.getInt8(at + 1);
			at += 2;
		}
		let [a, b, c, d] = [
			1,
			0,
			0,
			1
		];
		const f2dot14 = (offset) => view.getInt16(offset) / 16384;
		if ((flags & HAS_SCALE) !== 0) {
			a = d = f2dot14(at);
			at += 2;
		} else if ((flags & HAS_XY_SCALE) !== 0) {
			a = f2dot14(at);
			d = f2dot14(at + 2);
			at += 4;
		} else if ((flags & HAS_TWO_BY_TWO) !== 0) {
			[a, b, c, d] = [
				f2dot14(at),
				f2dot14(at + 2),
				f2dot14(at + 4),
				f2dot14(at + 6)
			];
			at += 8;
		}
		const [offsetX, offsetY] = (flags & ARGS_ARE_XY) !== 0 ? [dx, dy] : [0, 0];
		for (const contour of child(glyphId)) contours.push(contour.map((point) => ({
			x: a * point.x + c * point.y + offsetX,
			y: b * point.x + d * point.y + offsetY,
			isOnCurve: point.isOnCurve
		})));
		if ((flags & MORE_COMPONENTS) === 0) return contours;
	}
}
/** Turns TrueType points into path commands: two off-curve points imply an on-curve midpoint. */
function contourPath(contour) {
	const count = contour.length;
	const firstOn = contour.findIndex((point) => point.isOnCurve);
	if (count === 0) return [];
	const at = (index) => contour[(index % count + count) % count] ?? {
		x: 0,
		y: 0,
		isOnCurve: true
	};
	const mid = (p, q) => ({
		x: (p.x + q.x) / 2,
		y: (p.y + q.y) / 2,
		isOnCurve: true
	});
	const start = firstOn === -1 ? mid(at(0), at(1)) : at(firstOn);
	const from = firstOn === -1 ? 1 : firstOn + 1;
	const commands = [{
		kind: "move",
		x: start.x,
		y: start.y
	}];
	let control = null;
	for (let step = 0; step < count; step += 1) {
		const point = at(from + step);
		if (point.isOnCurve) {
			commands.push(control === null ? {
				kind: "line",
				x: point.x,
				y: point.y
			} : {
				kind: "quad",
				cx: control.x,
				cy: control.y,
				x: point.x,
				y: point.y
			});
			control = null;
		} else {
			if (control !== null) {
				const implied = mid(control, point);
				commands.push({
					kind: "quad",
					cx: control.x,
					cy: control.y,
					x: implied.x,
					y: implied.y
				});
			}
			control = point;
		}
	}
	if (control !== null) commands.push({
		kind: "quad",
		cx: control.x,
		cy: control.y,
		x: start.x,
		y: start.y
	});
	commands.push({ kind: "close" });
	return commands;
}
/** Reads a Unicode cmap subtable (format 12, or 4 for the BMP) into a lookup function. */
function readCmap(view) {
	const count = view.getUint16(2);
	let best = null;
	for (let index = 0; index < count; index += 1) {
		const platform = view.getUint16(4 + index * 8);
		const encoding = view.getUint16(6 + index * 8);
		const offset = view.getUint32(8 + index * 8);
		const format = view.getUint16(offset);
		if ((platform === 0 || platform === 3 && (encoding === 1 || encoding === 10)) && (format === 12 || format === 4 && best === null)) best = {
			offset,
			format
		};
	}
	if (best === null) throw new Error("The font has no Unicode cmap (format 4 or 12)");
	return best.format === 12 ? cmapFormat12(view, best.offset) : cmapFormat4(view, best.offset);
}
function cmapFormat12(view, offset) {
	const groups = view.getUint32(offset + 12);
	return (codePoint) => {
		let low = 0;
		let high = groups - 1;
		while (low <= high) {
			const middle = low + high >>> 1;
			const at = offset + 16 + middle * 12;
			const start = view.getUint32(at);
			const end = view.getUint32(at + 4);
			if (codePoint < start) high = middle - 1;
			else if (codePoint > end) low = middle + 1;
			else return view.getUint32(at + 8) + codePoint - start;
		}
		return 0;
	};
}
function cmapFormat4(view, offset) {
	const segments = view.getUint16(offset + 6) / 2;
	const ends = offset + 14;
	const starts = ends + segments * 2 + 2;
	const deltas = starts + segments * 2;
	const rangeOffsets = deltas + segments * 2;
	return (codePoint) => {
		if (codePoint > 65535) return 0;
		for (let segment = 0; segment < segments; segment += 1) {
			if (codePoint > view.getUint16(ends + segment * 2)) continue;
			const start = view.getUint16(starts + segment * 2);
			if (codePoint < start) return 0;
			const delta = view.getInt16(deltas + segment * 2);
			const rangeAt = rangeOffsets + segment * 2;
			const rangeOffset = view.getUint16(rangeAt);
			if (rangeOffset === 0) return codePoint + delta & 65535;
			const glyphId = view.getUint16(rangeAt + rangeOffset + (codePoint - start) * 2);
			return glyphId === 0 ? 0 : glyphId + delta & 65535;
		}
		return 0;
	};
}
// \0virtual:nsd-assets
var ttf = "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";
var subsetWasm = "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";
// ../../packages/core/src/model/id.ts
var prefixes = {
	diagram: "d",
	block: "b",
	branch: "r",
	fold: "f"
};
/**
* Creates an id generator for a document. A new id is the largest number already used with that
* prefix, plus one (01-model 1.7). No UUIDs, clocks, or random numbers, so commands stay
* deterministic. `alsoAvoid` adds ids that must not be reused even though the content no longer
* has them, for example ids still referred to by the view state.
*/
function createIdGenerator(content, alsoAvoid = []) {
	const largest = /* @__PURE__ */ new Map();
	const note = (id) => {
		const parsed = parseId(id);
		if (parsed !== null && parsed.number > (largest.get(parsed.prefix) ?? 0)) largest.set(parsed.prefix, parsed.number);
	};
	for (const id of contentIds(content)) note(id);
	for (const id of alsoAvoid) note(id);
	return { next: (kind) => {
		const prefix = prefixes[kind];
		const number = (largest.get(prefix) ?? 0) + 1;
		largest.set(prefix, number);
		return `${prefix}${String(number)}`;
	} };
}
/** Splits an id into its prefix and number, or returns `null` if it is not in that form. */
function parseId(id) {
	const match = /^([a-z]+)(\d+)$/.exec(id);
	if (match === null) return null;
	const [, prefix = "", digits = ""] = match;
	return {
		prefix,
		number: Number(digits)
	};
}
/**
* Lists every id defined in the content, in document order: diagrams, blocks, branches,
* fold regions and site fold regions. References (fold ranges, call targets) are not included.
*/
function* contentIds(content) {
	for (const diagram of content.diagrams) {
		yield diagram.id;
		yield* seqIds(diagram.body);
	}
}
function* seqIds(seq) {
	for (const block of seq.blocks) yield* blockIds(block);
	for (const fold of seq.folds) yield fold.id;
}
function* blockIds(block) {
	yield block.id;
	switch (block.kind) {
		case "process":
		case "exit": return;
		case "if":
			yield block.yes.id;
			yield* seqIds(block.yes.body);
			yield block.no.id;
			yield* seqIds(block.no.body);
			return;
		case "case":
			for (const arm of block.arms) {
				yield arm.id;
				yield* seqIds(arm.body);
			}
			if (block.otherwise !== null) {
				yield block.otherwise.id;
				yield* seqIds(block.otherwise.body);
			}
			return;
		case "while":
		case "doWhile":
		case "for":
		case "endless":
			yield* seqIds(block.body);
			return;
		case "parallel":
			for (const branch of block.branches) {
				yield branch.id;
				yield* seqIds(branch.body);
			}
			return;
		case "call":
			for (const fold of block.siteFolds) yield fold.id;
			return;
	}
}
// ../../packages/core/src/model/head.ts
/**
* The name of a header, without surrounding spaces. An Event's name is its whole text; a Method's
* name is the text before the first '(' (ADR-0022). Names are compared in this form, case
* sensitive (interaction rules "Event 헤더").
*/
function headName(head) {
	if (head.kind === "event") return head.text.trim();
	const open = head.text.indexOf("(");
	return (open < 0 ? head.text : head.text.slice(0, open)).trim();
}
// ../../packages/core/src/i18n/messages.ts
/**
* The screen languages, English first (the default, R-NFR-04). Adding a language is this line and
* one catalog entry per catalog (QA-13); the type checker then points at every catalog to fill.
*/
var locales = [
	"en",
	"ko",
	"de"
];
/** Whether a value is one of the screen languages (`locales`). */
function isLocale(value) {
	return locales.some((locale) => locale === value);
}
var catalog = {
	en: {
		"if.yes": "true",
		"if.no": "false",
		"case.default": "default",
		"call.noName": "(no name)",
		"folded.count": "{count} blocks",
		"fold.more": "{text} and {count} more",
		"fold.empty": "(empty block)",
		"endless.name": "(endless loop)"
	},
	ko: {
		"if.yes": "참",
		"if.no": "거짓",
		"case.default": "default",
		"call.noName": "(이름 없음)",
		"folded.count": "블록 {count}개",
		"fold.more": "{text} 외 {count}개",
		"fold.empty": "(빈 블록)",
		"endless.name": "(무한 반복)"
	},
	de: {
		"if.yes": "ja",
		"if.no": "nein",
		"case.default": "sonst",
		"call.noName": "(ohne Namen)",
		"folded.count": "{count} Blöcke",
		"fold.more": "{text} und {count} weitere",
		"fold.empty": "(leerer Block)",
		"endless.name": "(Endlosschleife)"
	}
};
var placeholderPattern = /\{(\w+)\}/g;
/**
* Returns the fixed word for a key in a locale. `{name}` placeholders take the given values.
*/
function drawingMessage(locale, key, values = {}) {
	return catalog[locale][key].replace(placeholderPattern, (whole, name) => {
		const value = values[name];
		return value === void 0 ? whole : String(value);
	});
}
// ../../packages/core/src/text/measure-text.ts
/** Font sizes of the drawing (visual design 4.1). */
var fontSizes = {
	/** Block text. */
	body: 13,
	/** Branch labels and other secondary text. */
	secondary: 12
};
/**
* Splits a text into lines at `\n` only. Long lines are never wrapped (UX LT1).
* An empty text is one empty line, so an empty block is not flat (02-layout 1.2).
*/
function splitLines(text) {
	return text.split("\n");
}
/**
* Returns the width of one line in px, rounded up to a whole px.
* Adds advance widths with no kerning (ADR-0026). Characters missing from the table count as
* full width (02-layout 2.1).
*/
function measureLine(line, fontSize = fontSizes.body, table = blockFont.advances) {
	const advances = advanceCache(table);
	let units = 0;
	for (const character of line) {
		const codePoint = character.codePointAt(0);
		if (codePoint !== void 0) {
			let advance = advances.get(codePoint);
			if (advance === void 0) {
				advance = advanceOf(table, codePoint);
				advances.set(codePoint, advance);
			}
			units += advance;
		}
	}
	return Math.ceil(units * fontSize / table.unitsPerEm);
}
var advanceCaches = /* @__PURE__ */ new WeakMap();
function advanceCache(table) {
	let cache = advanceCaches.get(table);
	if (cache === void 0) {
		cache = /* @__PURE__ */ new Map();
		advanceCaches.set(table, cache);
	}
	return cache;
}
/**
* Measures a possibly multi-line text (R-LAY-01): the longest line's width and lines × line height.
*/
function measureText(text, fontSize = fontSizes.body) {
	const lines = splitLines(text);
	let width = 0;
	for (const line of lines) width = Math.max(width, measureLine(line, fontSize));
	return {
		width,
		height: lines.length * 18,
		lines
	};
}
// ../../packages/core/src/text/syntax.ts
var words = (text) => new Set(text.split(/\s+/).filter(Boolean));
var cKeywords = "auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while _Bool _Complex _Imaginary _Alignas _Alignof _Atomic _Generic _Noreturn _Static_assert _Thread_local alignas alignof bool constexpr false nullptr static_assert thread_local true typeof typeof_unqual";
var cppKeywords = "alignas alignof and and_eq asm auto bitand bitor bool break case catch char char8_t char16_t char32_t class co_await co_return co_yield compl concept const const_cast consteval constexpr constinit continue decltype default delete do double dynamic_cast else enum explicit export extern false final float for friend goto if inline int long mutable namespace new noexcept not not_eq nullptr operator or or_eq override private protected public register reinterpret_cast requires return short signed sizeof static static_assert static_cast struct switch template this thread_local throw true try typedef typeid typename union unsigned using virtual void volatile wchar_t while xor xor_eq";
var javaKeywords = "abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while true false null var record yield sealed permits";
var javascriptKeywords = "async await break case catch class const continue debugger default delete do else export extends false finally for function if import in instanceof let new null of return static super switch this throw true try typeof undefined var void while with yield abstract as declare enum implements interface keyof namespace private protected public readonly satisfies type";
var pythonKeywords = "False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case";
var bashKeywords = "if then else elif fi case esac for select while until do done in function time break continue return exit local export readonly declare";
var cLike = {
	lineComments: ["//"],
	blockComment: ["/*", "*/"],
	multiLineQuotes: "",
	hasTripleQuotes: false,
	isDollarInWord: false,
	hasDirectives: false,
	isCommentAtWordStart: false,
	stringPrefixes: words(""),
	isQuoteDigitSeparator: false
};
/** The lexer of each language, `null` for plain text (not highlighted). */
var languages = {
	plain: null,
	c: {
		...cLike,
		keywords: words(cKeywords),
		quotes: `"'`,
		escapingQuotes: `"'`,
		hasDirectives: true
	},
	cpp: {
		...cLike,
		keywords: words(cppKeywords),
		quotes: `"'`,
		escapingQuotes: `"'`,
		hasDirectives: true,
		isQuoteDigitSeparator: true
	},
	java: {
		...cLike,
		keywords: words(javaKeywords),
		quotes: `"'`,
		escapingQuotes: `"'`,
		hasTripleQuotes: true,
		isDollarInWord: true
	},
	javascript: {
		...cLike,
		keywords: words(javascriptKeywords),
		quotes: "\"'`",
		escapingQuotes: "\"'`",
		multiLineQuotes: "`",
		isDollarInWord: true
	},
	python: {
		keywords: words(pythonKeywords),
		lineComments: ["#"],
		blockComment: null,
		quotes: `"'`,
		escapingQuotes: `"'`,
		multiLineQuotes: "",
		hasTripleQuotes: true,
		isDollarInWord: false,
		hasDirectives: false,
		isCommentAtWordStart: false,
		stringPrefixes: words("r u b f br rb fr rf R U B F BR RB FR RF Br bR Rb rB Fr fR Rf rF"),
		isQuoteDigitSeparator: false
	},
	bash: {
		keywords: words(bashKeywords),
		lineComments: ["#"],
		blockComment: null,
		quotes: `"'`,
		escapingQuotes: "\"",
		multiLineQuotes: `"'`,
		hasTripleQuotes: false,
		isDollarInWord: true,
		hasDirectives: false,
		isCommentAtWordStart: true,
		stringPrefixes: words(""),
		isQuoteDigitSeparator: false
	}
};
Object.keys(languages);
/** Whether a value is a language this version knows. Others are kept but drawn as plain text. */
function isTextKind(value) {
	return typeof value === "string" && Object.hasOwn(languages, value);
}
/** Letters (any script), digits, `_`: the characters of a word. */
var wordPart = /[\p{L}\p{M}\p{N}_]/u;
var wordStart = /[\p{L}\p{Nl}_]/u;
var digit = /[0-9]/;
/**
* Splits block text into tokens of a language (ADR-0032). Plain text is one `other` token.
* Unterminated strings end at the end of the line (or of the text, for strings that may span
* lines); an unterminated block comment runs to the end of the text.
*/
function tokenize(text, kind) {
	const language = languages[kind];
	if (language === null || text === "") return text === "" ? [] : [{
		kind: "other",
		text
	}];
	return new Lexer(text, language).run();
}
var Lexer = class {
	text;
	language;
	tokens = [];
	at = 0;
	constructor(text, language) {
		this.text = text;
		this.language = language;
	}
	run() {
		while (this.at < this.text.length) if ((this.comment() ?? this.string() ?? this.number() ?? this.word()) === null) this.push("other", this.at + 1);
		return this.tokens;
	}
	/** Adds the text from here to `end` as a token, joining it to an `other` token before it. */
	push(kind, end) {
		const piece = this.text.slice(this.at, end);
		const last = this.tokens[this.tokens.length - 1];
		if (kind === "other" && last?.kind === "other") this.tokens[this.tokens.length - 1] = {
			kind,
			text: last.text + piece
		};
		else this.tokens.push({
			kind,
			text: piece
		});
		this.at = end;
		return end;
	}
	startsWith(marker, at = this.at) {
		return this.text.startsWith(marker, at);
	}
	lineEnd(from) {
		const end = this.text.indexOf("\n", from);
		return end === -1 ? this.text.length : end;
	}
	comment() {
		const { blockComment, lineComments } = this.language;
		if (blockComment !== null && this.startsWith(blockComment[0])) {
			const close = this.text.indexOf(blockComment[1], this.at + blockComment[0].length);
			return this.push("comment", close === -1 ? this.text.length : close + blockComment[1].length);
		}
		for (const marker of lineComments) if (this.startsWith(marker) && this.isCommentHere()) return this.push("comment", this.lineEnd(this.at));
		return null;
	}
	isCommentHere() {
		if (!this.language.isCommentAtWordStart || this.at === 0) return true;
		return /[\s;|&()]/.test(this.text.charAt(this.at - 1));
	}
	/** A string starting here, with an optional word prefix (Python). */
	string(from = this.at) {
		const quote = this.text.charAt(from);
		if (quote === "" || !this.language.quotes.includes(quote)) return null;
		const triple = quote.repeat(3);
		if (this.language.hasTripleQuotes && this.startsWith(triple, from)) {
			const close = this.text.indexOf(triple, from + 3);
			return this.push("string", close === -1 ? this.text.length : close + 3);
		}
		const isEscaping = this.language.escapingQuotes.includes(quote);
		const isMultiLine = this.language.multiLineQuotes.includes(quote);
		let at = from + 1;
		while (at < this.text.length) {
			const char = this.text.charAt(at);
			if (char === quote) return this.push("string", at + 1);
			if (char === "\n" && !isMultiLine) break;
			at += isEscaping && char === "\\" && this.text.charAt(at + 1) !== "\n" ? 2 : 1;
		}
		return this.push("string", Math.min(at, this.text.length));
	}
	number() {
		const text = this.text;
		const first = text.charAt(this.at);
		if (!(digit.test(first) || first === "." && digit.test(text.charAt(this.at + 1)) && text.charAt(this.at - 1) !== ".") || this.isAfterWord()) return null;
		let at = this.at;
		while (at < text.length) {
			const char = text.charAt(at);
			if (char === "." && text.charAt(at + 1) === ".") break;
			if ((char === "+" || char === "-") && /[eEpP]/.test(text.charAt(at - 1))) at += 1;
			else if (/[0-9A-Za-z_.]/.test(char) || char === "'" && this.language.isQuoteDigitSeparator && /[0-9a-fA-F]/.test(text.charAt(at + 1))) at += 1;
			else break;
		}
		return this.push("number", at);
	}
	isAfterWord() {
		const before = this.text.charAt(this.at - 1);
		return before !== "" && (wordPart.test(before) || this.isDollar(before));
	}
	isDollar(char) {
		return this.language.isDollarInWord && char === "$";
	}
	word() {
		const text = this.text;
		const first = text.charAt(this.at);
		if (this.language.hasDirectives && first === "#" && this.isLineStart()) {
			let at = this.at + 1;
			while (at < text.length && /[A-Za-z_]/.test(text.charAt(at))) at += 1;
			return at > this.at + 1 ? this.push("keyword", at) : null;
		}
		const firstPoint = String.fromCodePoint(text.codePointAt(this.at) ?? 0);
		if (!wordStart.test(firstPoint) && !this.isDollar(first)) return null;
		let at = this.at + firstPoint.length;
		while (at < text.length) {
			const point = String.fromCodePoint(text.codePointAt(at) ?? 0);
			if (!wordPart.test(point) && !this.isDollar(point)) break;
			at += point.length;
		}
		const word = text.slice(this.at, at);
		if (this.language.stringPrefixes.has(word)) {
			const end = this.string(at);
			if (end !== null) return end;
		}
		return this.push(this.language.keywords.has(word) ? "keyword" : "other", at);
	}
	isLineStart() {
		const before = this.text.slice(0, this.at);
		const lineStart = before.lastIndexOf("\n") + 1;
		return before.slice(lineStart).trim() === "";
	}
};
/**
* Tokens split into the lines of the text (`\n`), for drawing one line at a time. A token that
* spans lines (a block comment) is cut at each line break; the breaks themselves are dropped.
*/
function tokenLines(tokens) {
	const lines = [[]];
	for (const token of tokens) token.text.split("\n").forEach((piece, index) => {
		if (index > 0) lines.push([]);
		if (piece !== "") lines[lines.length - 1]?.push({
			kind: token.kind,
			text: piece
		});
	});
	return lines;
}
/** What stands in front of the ids shown inside the opened call path `path`: `b4/b9/`. */
function sitePrefix(path) {
	return path.join("/") + "/";
}
/**
* Whether `id` of a Method is folded where it is shown behind `prefix`. A call site without its
* own folding yet (a file saved before ADR-0046, read but not settled) shows the Method's.
*/
function isFoldedAt(folded, prefix, id) {
	return hasOwnSite(folded, prefix) ? folded.has(prefix + id) : folded.has(id);
}
/**
* Whether the call site shown behind `prefix` has its own folding and fold regions (`b4/`): the
* Method's regions were copied there and are no longer drawn at it (ADR-0047). A site without it
* (not opened yet, or a file saved before) draws the Method's regions.
*/
function hasOwnSite(folded, prefix) {
	return prefix !== "" && folded.has(prefix);
}
/** The fold regions marked on a sequence and on every sequence inside it, in document order. */
function regionsIn(seq) {
	const found = [];
	const visit = (inner) => {
		for (const block of inner.blocks) for (const child of innerSeqs(block)) visit(child);
		found.push(...inner.folds);
	};
	visit(seq);
	return found;
}
/** The branches and loop blocks of a sequence that can fold, fold regions left out. */
function controlFoldableIds(seq) {
	const regions = new Set(regionsIn(seq).map((fold) => fold.id));
	return [...seqFoldableIds(seq, false)].filter((id) => !regions.has(id));
}
/** The sequences directly inside a block, left to right. */
function innerSeqs(block) {
	switch (block.kind) {
		case "process":
		case "exit":
		case "call": return [];
		case "if": return [block.yes.body, block.no.body];
		case "parallel": return block.branches.map((branch) => branch.body);
		case "case": return [...block.arms.map((arm) => arm.body), ...block.otherwise === null ? [] : [block.otherwise.body]];
		case "while":
		case "doWhile":
		case "for":
		case "endless": return [block.body];
	}
}
/**
* Lists the ids that can be folded on a sequence, in document order: branches of If, Case and
* parallel blocks,
* loop blocks and fold regions, and with `withSiteFolds` the site fold regions of call blocks.
*/
function* seqFoldableIds(seq, withSiteFolds) {
	for (const block of seq.blocks) yield* blockFoldableIds(block, withSiteFolds);
	for (const fold of seq.folds) yield fold.id;
}
function* blockFoldableIds(block, withSiteFolds) {
	switch (block.kind) {
		case "process":
		case "exit": return;
		case "parallel":
			for (const branch of block.branches) {
				yield branch.id;
				yield* seqFoldableIds(branch.body, withSiteFolds);
			}
			return;
		case "if":
			yield block.yes.id;
			yield* seqFoldableIds(block.yes.body, withSiteFolds);
			yield block.no.id;
			yield* seqFoldableIds(block.no.body, withSiteFolds);
			return;
		case "case":
			for (const arm of block.arms) {
				yield arm.id;
				yield* seqFoldableIds(arm.body, withSiteFolds);
			}
			if (block.otherwise !== null) {
				yield block.otherwise.id;
				yield* seqFoldableIds(block.otherwise.body, withSiteFolds);
			}
			return;
		case "while":
		case "doWhile":
		case "for":
		case "endless":
			yield block.id;
			yield* seqFoldableIds(block.body, withSiteFolds);
			return;
		case "call":
			if (withSiteFolds) for (const fold of block.siteFolds) yield fold.id;
			return;
	}
}
function* callsIn(seq) {
	for (const block of seq.blocks) {
		if (block.kind === "call") yield block;
		for (const inner of innerSeqs(block)) yield* callsIn(inner);
	}
}
function callPlaces(content) {
	const places = /* @__PURE__ */ new Map();
	for (const diagram of content.diagrams) for (const call of callsIn(diagram.body)) places.set(call.id, {
		call,
		diagram: diagram.id
	});
	return places;
}
/**
* A path exists when every id is a call block, and each inner one is in the Method that the call
* block before it calls (a local target). Paths through other documents are not designed yet
* (01-model, open questions), so they do not exist.
*/
function pathExists(places, path) {
	return path.length > 0 && path.every((id, at) => {
		const here = places.get(id);
		if (here === void 0) return false;
		const outer = at === 0 ? void 0 : places.get(path[at - 1] ?? "");
		return outer === void 0 || outer.call.target.kind === "local" && outer.call.target.diagram === here.diagram;
	});
}
/** The Method shown inside the opened call path `path`, or `null` when nothing can be shown. */
function methodAt(content, places, path) {
	const target = places.get(path.at(-1) ?? "")?.call.target;
	if (target?.kind !== "local" || !pathExists(places, path)) return null;
	const method = content.diagrams.find((diagram) => diagram.id === target.diagram);
	return method?.head?.kind === "method" ? method : null;
}
/** Keeps the paths that still exist, without duplicates, in document order. */
function existingPaths(content, paths) {
	return sortedPaths(content, callPlaces(content), paths);
}
function sortedPaths(content, places, paths) {
	const order = /* @__PURE__ */ new Map();
	let index = 0;
	for (const id of contentIds(content)) {
		order.set(id, index);
		index += 1;
	}
	const unique = /* @__PURE__ */ new Map();
	for (const path of paths) if (pathExists(places, path)) unique.set(path.join(" "), [...path]);
	return [...unique.values()].sort((left, right) => comparePaths(left, right, order));
}
function comparePaths(left, right, order) {
	const length = Math.min(left.length, right.length);
	for (let at = 0; at < length; at += 1) {
		const difference = (order.get(left[at] ?? "") ?? 0) - (order.get(right[at] ?? "") ?? 0);
		if (difference !== 0) return difference;
	}
	return left.length - right.length;
}
/** Whether the path is drawn: it and every path around it are opened. */
function isShownPath(path, opened) {
	return path.every((_, at) => opened.has(path.slice(0, at + 1).join("/")));
}
function openedKeys(view) {
	return new Set(view.opened.map((path) => path.join("/")));
}
/**
* The entries of the call sites' folding a file keeps, in document order (01-file-format 3.1).
* A site says nothing when opening the file would give it the same folding again: its Method has no
* fold regions to copy (ADR-0047), and it is drawn and folded like the Method, or it is closed with
* nothing folded here and in the Method. Sites that
* no longer exist and ids no longer in the Method are not written.
*/
function siteFoldedEntries(doc) {
	const { content, view } = doc;
	const marked = view.folded.filter((entry) => entry.endsWith("/")).map((entry) => entry.slice(0, -1).split("/"));
	if (marked.length === 0) return [];
	const places = callPlaces(content);
	const opened = openedKeys(view);
	const folded = new Set(view.folded);
	return sortedPaths(content, places, marked).flatMap((path) => {
		const method = methodAt(content, places, path);
		if (method === null) return [];
		const prefix = sitePrefix(path);
		const ids = controlFoldableIds(method.body);
		const here = ids.filter((id) => folded.has(prefix + id));
		const there = ids.filter((id) => folded.has(id));
		const isSame = here.length === there.length && here.every((id, at) => id === there[at]);
		return regionsIn(method.body).length > 0 || (isShownPath(path, opened) ? !isSame : here.length > 0 || there.length > 0) ? [prefix, ...here.map((id) => prefix + id)] : [];
	});
}
// ../../packages/core/src/layout/geometry.ts
/** Dimension tokens in px, named as in visual design 5. */
var geometry = {
	"space.pad-x": 10,
	"space.pad-y": 7,
	"space.line": 18,
	"size.block-min-w": 52,
	"size.loop-strip": 22,
	"size.exit-wedge": 14,
	"size.parallel-band": 18,
	"size.if-label": 16,
	"size.case-label": 28,
	"size.if-head-extra": 70,
	"size.case-head-extra": 90,
	"size.label-room": 18,
	"size.label-inset": 6,
	"size.call-bar": 7,
	"size.hat": 16,
	"size.hat-w": 110,
	"size.hat-room": 24,
	"size.title-tag": 16,
	"size.title-gap": 6,
	"size.column-min": 420,
	"size.diagram-min-w": 160,
	"size.text-halo": 3,
	"size.band": 18,
	"size.band-text-x": 10,
	"size.band-icon-room": 10,
	"size.fold-icon-room": 20,
	"size.fold-extra-h": 4,
	"size.fold-edge": 3,
	"size.nest-gap": 1,
	"size.nest-inset": 4,
	"size.peek-inset": 4,
	"space.diagram": 44,
	"space.kind-gap": 88,
	"space.paper": 24
};
// ../../packages/core/src/layout/call-text.ts
/**
* The parts of a call block's text. A local target's name is its Method header's text before the
* first '('; with parentheses in the header the call always shows `(args)`, otherwise only when
* there are arguments. A call without a name shows the "no name" word.
*/
function callParts(context, block) {
	const before = block.result === "" ? "" : `${block.result} ${context.resultSymbol} `;
	const target = block.target;
	let name;
	let hasParentheses = false;
	switch (target.kind) {
		case "local": {
			const head = context.diagrams.get(target.diagram)?.head?.text ?? "";
			const open = head.indexOf("(");
			name = (open < 0 ? head : head.slice(0, open)).trim();
			hasParentheses = open >= 0;
			break;
		}
		case "named": name = target.name;
	}
	if (name === "") name = drawingMessage(context.locale, "call.noName");
	const after = block.args !== "" || hasParentheses ? `(${block.args})` : "";
	return {
		before,
		name,
		after
	};
}
/** A call block's text on one line, as it is drawn: `ys ← MergeSort(xs)`. */
function callText(context, block) {
	const parts = callParts(context, block);
	return parts.before + parts.name + parts.after;
}
// ../../packages/core/src/layout/shown.ts
/** The screen id of `id` drawn behind `prefix` (`''` outside opened calls, else `b4/`). */
function screenId(prefix, id) {
	return prefix + id;
}
/** The prefix of the blocks shown inside the opened call block with screen id `call`. */
function prefixInside(call) {
	return call + "/";
}
/** Reads the view state into sets. */
function shownView(view) {
	return {
		folded: new Set(view.folded),
		opened: new Set(view.opened.map((path) => path.join("/"))),
		bands: view.bands
	};
}
/** The place outside every opened call. */
var topLevel = {
	prefix: "",
	siteRanges: /* @__PURE__ */ new Map(),
	site: null
};
/**
* Where the blocks of the Method a call block calls are shown when it is opened: behind the
* call's screen id, with the site regions that belong here (01-model 1.6). `outer` is where the
* call block itself is shown, `outermost` the outermost call block of the path.
*/
function insideCall(outer, call, callScreenId, method, outermost) {
	const via = outer.site === null ? [] : [...outer.site.via, call.id];
	const site = {
		call: outermost.id,
		via
	};
	const folds = outermost.siteFolds.filter((fold) => sameIds(fold.via, via));
	return {
		prefix: prefixInside(callScreenId),
		siteRanges: placeSiteFolds(method.body, folds),
		site
	};
}
function sameIds(a, b) {
	return a.length === b.length && a.every((id, index) => id === b[index]);
}
/**
* Puts each site region on the sequence of the Method holding its first block, or its last when
* the first is gone. Only blocks that are still there count: a region whose ends are both in the
* sequence holds the blocks between them, one with a single end left holds that block, and one
* with no end left is not shown (UX P2, 01-model 1.6).
*/
function placeSiteFolds(body, folds) {
	const places = /* @__PURE__ */ new Map();
	if (folds.length === 0) return places;
	const where = /* @__PURE__ */ new Map();
	const visit = (seq) => {
		seq.blocks.forEach((block, index) => {
			where.set(block.id, {
				seq,
				index
			});
			for (const inner of innerSeqs(block)) visit(inner);
		});
	};
	visit(body);
	for (const fold of folds) {
		const first = where.get(fold.first);
		const last = where.get(fold.last);
		const end = first ?? last;
		if (end === void 0) continue;
		const range = last !== void 0 && first?.seq === last.seq ? {
			fold,
			lo: Math.min(first.index, last.index),
			hi: Math.max(first.index, last.index)
		} : {
			fold,
			lo: end.index,
			hi: end.index
		};
		places.set(end.seq, [...places.get(end.seq) ?? [], range]);
	}
	return places;
}
/**
* The shown items of a sequence. Regions marked on it come first, except at a call site that has
* its own regions (ADR-0047); regions of the call site join where they nest with those and are
* left out where they would cross one or repeat its range (invariant 5 holds for the Method, not
* for what the site adds).
*/
function shownItems(seq, at, view) {
	const accepted = [];
	const isClash = (lo, hi) => accepted.some((other) => other.lo === lo && other.hi === hi || other.lo < lo && lo <= other.hi && other.hi < hi || lo < other.lo && other.lo <= hi && hi < other.hi);
	const position = new Map(seq.blocks.map((block, index) => [block.id, index]));
	const marks = hasOwnSite(view.folded, at.prefix) ? [] : seq.folds;
	for (const fold of marks) {
		const a = position.get(fold.first);
		const b = position.get(fold.last);
		if (a === void 0 || b === void 0 || a > b || isClash(a, b)) continue;
		accepted.push({
			lo: a,
			hi: b,
			fold: {
				screenId: screenId(at.prefix, fold.id),
				id: fold.id,
				...fold.name === void 0 ? {} : { name: fold.name },
				site: null
			}
		});
	}
	for (const range of at.siteRanges.get(seq) ?? []) {
		if (isClash(range.lo, range.hi) || at.site === null) continue;
		accepted.push({
			lo: range.lo,
			hi: range.hi,
			fold: {
				screenId: screenId(at.prefix, range.fold.id),
				id: range.fold.id,
				...range.fold.name === void 0 ? {} : { name: range.fold.name },
				site: at.site
			}
		});
	}
	if (accepted.length === 0) return seq.blocks.map((block) => ({
		kind: "block",
		block
	}));
	accepted.sort((left, right) => left.lo - right.lo || right.hi - left.hi);
	return nest(seq, accepted, 0, seq.blocks.length - 1, null, view, at);
}
function nest(seq, ranges, from, to, around, view, at) {
	const items = [];
	let index = from;
	while (index <= to) {
		const region = ranges.find((range) => range !== around && range.lo === index && range.hi <= to);
		if (region === void 0) {
			const block = seq.blocks[index];
			if (block !== void 0) items.push({
				kind: "block",
				block
			});
			index += 1;
			continue;
		}
		const inner = nest(seq, ranges, region.lo, region.hi, region, view, at);
		const isFolded = region.fold.site === null ? isFoldedAt(view.folded, at.prefix, region.fold.id) : view.folded.has(region.fold.id);
		if (!isFolded && !view.bands) items.push(...inner);
		else items.push({
			kind: "fold",
			fold: {
				...region.fold,
				isFolded,
				blocks: seq.blocks.slice(region.lo, region.hi + 1)
			},
			items: inner
		});
		index = region.hi + 1;
	}
	return items;
}
/** How many blocks a sequence holds, the blocks inside control blocks included. */
function countBlocks(seq) {
	let count = 0;
	for (const block of seq.blocks) {
		count += 1;
		for (const inner of innerSeqs(block)) count += countBlocks(inner);
	}
	return count;
}
// ../../packages/core/src/layout/layout.ts
var padX$1 = geometry["space.pad-x"];
var padY$1 = geometry["space.pad-y"];
var line = geometry["space.line"];
var blockMinWidth = geometry["size.block-min-w"];
var loopStrip = geometry["size.loop-strip"];
var exitWedge$1 = geometry["size.exit-wedge"];
var parallelBand$1 = geometry["size.parallel-band"];
var labelRoom = geometry["size.label-room"];
var callBar$1 = geometry["size.call-bar"];
var diagramMinWidth = geometry["size.diagram-min-w"];
var diagramGap = geometry["space.diagram"];
var paper = geometry["space.paper"];
var band$1 = geometry["size.band"];
var bandTextX$1 = geometry["size.band-text-x"];
var bandIconRoom = geometry["size.band-icon-room"];
var foldIconRoom$1 = geometry["size.fold-icon-room"];
var foldExtraHeight = geometry["size.fold-extra-h"];
var nestGap = geometry["size.nest-gap"];
var nestInset = geometry["size.nest-inset"];
var peekInset = geometry["size.peek-inset"];
var noInsets = {
	left: 0,
	right: 0,
	bottom: 0
};
/** The sequence right inside a frame reaches its two sides and its bottom. */
function insetsOfFrame(inset) {
	return {
		left: inset,
		right: inset,
		bottom: inset
	};
}
/** What an item of a sequence reaches: only the last one reaches the bottom. */
function insetsOfItem(insets, isLast) {
	return isLast ? insets : {
		...insets,
		bottom: 0
	};
}
/** A loop's body lies right of its strip; a Do-While's condition lies below its body. */
function insetsOfLoopBody(insets, block) {
	return {
		left: 0,
		right: insets.right,
		bottom: block.kind === "doWhile" ? 0 : insets.bottom
	};
}
/** An endless loop's body lies inside its left strip and above its bottom strip (UX EL1). */
function insetsOfEndlessBody(insets) {
	return {
		left: 0,
		right: insets.right,
		bottom: 0
	};
}
/** A parallel block's branches lie above its bottom band (UX PB1). */
function insetsOfParallelColumn(insets, column, count) {
	return {
		...insetsOfColumn(insets, column, count),
		bottom: 0
	};
}
/** A branch column reaches the left side when it is the first, the right side when the last. */
function insetsOfColumn(insets, column, count) {
	return {
		left: column === 0 ? insets.left : 0,
		right: column === count - 1 ? insets.right : 0,
		bottom: insets.bottom
	};
}
/** How far the fold triangle's click box reaches into a band or a folded cell. */
var toggleWidth = 18;
/** The size of an empty process block: the stand-in for a Case's missing default (UX CD1). */
var emptyBlockSize = {
	width: Math.max(blockMinWidth, 2 * padX$1),
	height: line + 2 * padY$1
};
/**
* Lays out a document: every block's bounding box, the click regions and what to draw
* (02-layout 1). Pure: the same document gives the same result (R-FMT-03). The fixed words
* ("true" / "false") are in the document's drawing language `settings.locale` (ADR-0041).
* Folded branches, loop bodies and fold regions, opened call blocks and name bands follow the
* view state (02-layout 1.6); ids the view names that are gone are ignored.
*/
function layout(doc) {
	const diagrams = new Map(doc.content.diagrams.map((diagram) => [diagram.id, diagram]));
	const context = {
		locale: doc.content.settings.locale,
		shown: shownView(doc.view),
		words: {
			locale: doc.content.settings.locale,
			resultSymbol: doc.view.resultSymbol,
			diagrams
		},
		calls: callsOf(doc.content.diagrams),
		measures: /* @__PURE__ */ new Map(),
		folds: /* @__PURE__ */ new Map(),
		items: /* @__PURE__ */ new Map(),
		boxes: /* @__PURE__ */ new Map(),
		regions: [],
		nodes: []
	};
	const headStyle = doc.content.settings.headStyle;
	const arrangement = arrange(doc.content.diagrams.map((diagram) => measureDiagram(context, diagram, headStyle)));
	const placed = [];
	for (const { measure, x, y } of arrangement.placed) {
		const { diagram, width, headHeight, bodyHeight, headText } = measure;
		const box = {
			x: paper + x,
			y: paper + y,
			width,
			height: headHeight + bodyHeight
		};
		let head = null;
		if (diagram.head !== null && headText !== null) {
			head = {
				x: box.x,
				y: box.y,
				width,
				height: headHeight
			};
			context.nodes.push({
				kind: "diagramHead",
				id: diagram.id,
				headKind: diagram.head.kind,
				style: headStyle,
				box: head,
				text: placedText(headText)
			});
			context.regions.push({
				kind: "diagramHead",
				diagramId: diagram.id,
				box: head
			});
		}
		const body = {
			x: box.x,
			y: box.y + headHeight,
			width,
			height: bodyHeight
		};
		placeSeq(context, diagram.body, body, topLevel, noInsets, false);
		context.boxes.set(diagram.id, box);
		placed.push({
			id: diagram.id,
			box,
			head,
			body
		});
	}
	return {
		width: paper + arrangement.width + paper,
		height: paper + arrangement.height + paper,
		diagrams: placed,
		boxes: context.boxes,
		regions: context.regions,
		nodes: context.nodes
	};
}
function callsOf(diagrams) {
	const calls = /* @__PURE__ */ new Map();
	const visit = (seq) => {
		for (const block of seq.blocks) {
			if (block.kind === "call") calls.set(block.id, block);
			for (const inner of innerSeqs(block)) visit(inner);
		}
	};
	for (const diagram of diagrams) visit(diagram.body);
	return calls;
}
function measureDiagram(context, diagram, headStyle) {
	const body = measureSeq(context, diagram.body, topLevel, noInsets);
	let width = Math.max(body.width, diagramMinWidth);
	if (diagram.head === null) return {
		diagram,
		width,
		headHeight: 0,
		bodyHeight: body.height,
		headText: null
	};
	const text = measureText(diagram.head.text);
	let headHeight;
	if (headStyle === "title") {
		const label = measureLine(headLabel(diagram.head.kind), fontSizes.secondary);
		width = Math.max(width, text.width, label);
		headHeight = geometry["size.title-tag"] + text.height + geometry["size.title-gap"];
	} else {
		width = Math.max(width, text.width + 2 * padX$1 + geometry["size.hat-room"]);
		headHeight = geometry["size.hat"] + text.height + 2 * padY$1;
	}
	return {
		diagram,
		width,
		headHeight,
		bodyHeight: body.height,
		headText: text
	};
}
/** The small label above a header drawn like a title. The same words in every language. */
function headLabel(kind) {
	return kind === "event" ? "Event" : "Method";
}
/**
* Places the diagrams (02-layout 1.7): Events and diagrams without a header on the left, Methods
* on the right. Each group is stacked top to bottom and wraps into a new column past the column
* height. The column height is chosen, in 4px steps, so the whole picture is closest to 16 : 10.
* Coordinates are relative to the paper margin.
*/
function arrange(measures) {
	const left = measures.filter((m) => m.diagram.head?.kind !== "method");
	const right = measures.filter((m) => m.diagram.head?.kind === "method");
	const heightOf = (m) => m.headHeight + m.bodyHeight;
	const tallest = Math.max(0, ...measures.map(heightOf));
	const oneColumn = (group) => sum(group.map(heightOf)) + Math.max(0, group.length - 1) * diagramGap;
	const lowest = Math.max(geometry["size.column-min"], tallest);
	const highest = Math.max(lowest, oneColumn(left), oneColumn(right));
	const tryLimit = (limit) => {
		const a = stack(left, limit, heightOf);
		const b = stack(right, limit, heightOf);
		const gap = a.width > 0 && b.width > 0 ? geometry["space.kind-gap"] : 0;
		const width = a.width + gap + b.width;
		const height = Math.max(a.height, b.height);
		return {
			score: height === 0 ? 0 : Math.abs(width / height - 1.6),
			a,
			b,
			width,
			height
		};
	};
	let best = tryLimit(lowest);
	for (let limit = lowest + 4; limit <= highest + 3; limit += 4) {
		const candidate = tryLimit(limit);
		if (candidate.score < best.score - 1e-9) best = candidate;
	}
	const shift = best.a.width + (best.a.width > 0 && best.b.width > 0 ? geometry["space.kind-gap"] : 0);
	return {
		width: best.width,
		height: best.height,
		placed: [...best.a.placed, ...best.b.placed.map((p) => ({
			...p,
			x: p.x + shift
		}))]
	};
}
/** Stacks one group in columns no taller than `limit` (the first diagram of a column may be). */
function stack(group, limit, heightOf) {
	let x = 0;
	let y = 0;
	let widest = 0;
	let bottom = 0;
	const placed = [];
	for (const measure of group) {
		const height = heightOf(measure);
		if (y > 0 && y + height > limit) {
			x += widest + diagramGap;
			y = 0;
			widest = 0;
		}
		placed.push({
			measure,
			x,
			y
		});
		widest = Math.max(widest, measure.width);
		bottom = Math.max(bottom, y + height);
		y += height + diagramGap;
	}
	return {
		width: group.length > 0 ? x + widest : 0,
		height: bottom,
		placed
	};
}
function itemsOf(context, seq, at) {
	let byPlace = context.items.get(seq);
	if (byPlace === void 0) {
		byPlace = /* @__PURE__ */ new Map();
		context.items.set(seq, byPlace);
	}
	let items = byPlace.get(at.prefix);
	if (items === void 0) {
		items = shownItems(seq, at, context.shown);
		byPlace.set(at.prefix, items);
	}
	return items;
}
/** Where an opened call block shows its Method, or `null` when it is not opened (or cannot be). */
function openedInside(context, block, at) {
	const id = screenId(at.prefix, block.id);
	if (!context.shown.opened.has(id) || block.target.kind !== "local") return null;
	const method = context.words.diagrams.get(block.target.diagram);
	const outermost = at.site === null ? block : context.calls.get(at.site.call);
	if (method?.head?.kind !== "method" || outermost === void 0) return null;
	return insideCall(at, block, id, method, outermost);
}
/** Whether an item is drawn with a border: an unfolded fold region's frame, an opened call. */
function isFramed(context, item, at) {
	if (item.kind === "fold") return !item.fold.isFolded;
	return item.block.kind === "call" && context.measures.get(screenId(at.prefix, item.block.id))?.kind === "peek";
}
/**
* The name drawn for a fold region: its own name, or the default name "the first block's text
* and n more" (interaction rules "접기 · 펼치기"), in the drawing language.
*/
function foldLabel(words, fold) {
	if (fold.name !== void 0 && fold.name !== "") return {
		text: fold.name,
		isNamed: true
	};
	return {
		text: defaultFoldName(words, fold.blocks),
		isNamed: false
	};
}
/** The default name of a region holding `blocks`: "the first block's text and n more". */
function defaultFoldName(words, blocks) {
	const [first] = blocks;
	const text = (first === void 0 ? "" : first.kind === "call" ? callText(words, first) : first.kind === "endless" ? drawingMessage(words.locale, "endless.name") : first.text).split("\n")[0] ?? "";
	const shown = text === "" ? drawingMessage(words.locale, "fold.empty") : text;
	const rest = blocks.length - 1;
	return rest > 0 ? drawingMessage(words.locale, "fold.more", {
		text: shown,
		count: rest
	}) : shown;
}
/** The words of a folded row: "n blocks" in the drawing language. */
function foldedWords(context, seq) {
	return drawingMessage(context.locale, "folded.count", { count: countBlocks(seq) });
}
/**
* Measures a sequence. `insets` is how far framed items sit inside the frame around the sequence,
* however many control blocks lie between: they are inset at the sides the sequence reaches, and
* two framed items in a row keep a gap (02-layout 1.6).
*/
function measureSeq(context, seq, at, insets) {
	return measureItems(context, itemsOf(context, seq, at), at, insets);
}
function measureItems(context, items, at, insets) {
	let width = 0;
	let height = 0;
	let wasFramed = false;
	items.forEach((item, index) => {
		const isLast = index === items.length - 1;
		const size = measureItem(context, item, at, insetsOfItem(insets, isLast));
		const framed = isFramed(context, item, at);
		width = Math.max(width, size.width + (framed ? insets.left + insets.right : 0));
		height += size.height + (framed && wasFramed ? gapBetweenFrames : 0);
		if (framed && isLast) height += insets.bottom;
		wasFramed = framed;
	});
	return {
		width,
		height
	};
}
/** Two frames in a row: the shared line splits into two, with a 1px gap between (02-layout 1.6). */
var gapBetweenFrames = 1 + nestGap;
function measureItem(context, item, at, insets) {
	if (item.kind === "block") return measureBlock(context, item.block, at, insets);
	return measureFold(context, item.fold, item.items, at);
}
function measureFold(context, fold, items, at) {
	const label = foldLabel(context.words, fold);
	let measure;
	if (fold.isFolded) {
		const name = measureText(label.text);
		measure = {
			kind: "cell",
			name,
			isNamed: label.isNamed,
			width: name.width + 2 * padX$1 + foldIconRoom$1,
			height: name.height + 2 * padY$1 + foldExtraHeight
		};
	} else {
		const inner = measureItems(context, items, at, insetsOfFrame(nestInset));
		const text = oneLine(label.text);
		const nameWidth = measureLine(text, fontSizes.secondary);
		measure = {
			kind: "frame",
			name: {
				lines: [text],
				width: nameWidth
			},
			isNamed: label.isNamed,
			width: Math.max(inner.width, bandTextWidth(nameWidth)),
			height: band$1 + inner.height
		};
	}
	context.folds.set(fold.screenId, measure);
	return measure;
}
/** The smallest width of a band holding text this wide: room, the triangle, the text, padding. */
function bandTextWidth(textWidth) {
	return bandTextX$1 + bandIconRoom + textWidth + padX$1;
}
function oneLine(text) {
	return text.replace(/\r\n|\r|\n/g, " ");
}
function measureBlock(context, block, at, insets) {
	const measure = measureBlockOnce(context, block, at, insets);
	context.measures.set(screenId(at.prefix, block.id), measure);
	return measure;
}
function measureBlockOnce(context, block, at, insets) {
	switch (block.kind) {
		case "process": {
			const text = measureText(block.text);
			return {
				kind: "process",
				text,
				width: Math.max(blockMinWidth, text.width + 2 * padX$1),
				height: text.height + 2 * padY$1
			};
		}
		case "exit": {
			const text = measureText(block.text);
			return {
				kind: "exit",
				text,
				width: Math.max(blockMinWidth, exitWedge$1 + text.width + 2 * padX$1),
				height: text.height + 2 * padY$1
			};
		}
		case "call": return measureCall(context, block, at);
		case "while":
		case "doWhile":
		case "for": return measureLoop(context, block, at, insets);
		case "endless": return measureEndless(context, block, at, insets);
		case "parallel": return measureParallel(context, block, at, insets);
		case "if": return measureIf(context, block, at, insets);
		case "case": return measureCase(context, block, at, insets);
	}
}
/**
* Measures the body of a branch or loop: one row "⋯ n blocks" when it is folded (R-EDIT-13),
* otherwise its sequence.
*/
function measureBody(context, owner, seq, at, insets) {
	if (isFoldedAt(context.shown.folded, at.prefix, owner)) return {
		width: padX$1 + 16 + measureLine(foldedWords(context, seq), fontSizes.secondary) + padX$1,
		height: line + 2 * padY$1
	};
	return measureSeq(context, seq, at, insets);
}
function measureLoop(context, block, at, insets) {
	const text = measureText(block.text);
	const headHeight = text.height + 2 * padY$1;
	const body = measureBody(context, block.id, block.body, at, insetsOfLoopBody(insets, block));
	return {
		kind: "loop",
		text,
		headHeight,
		width: Math.max(text.width + 2 * padX$1, loopStrip + body.width),
		height: headHeight + body.height
	};
}
function measureEndless(context, block, at, insets) {
	const body = measureBody(context, block.id, block.body, at, insetsOfEndlessBody(insets));
	return {
		kind: "endless",
		width: loopStrip + body.width,
		height: loopStrip + body.height + loopStrip
	};
}
function measureParallel(context, block, at, insets) {
	const text = measureText(block.text);
	const topHeight = block.text === "" ? parallelBand$1 : text.height + 2 * padY$1;
	const count = block.branches.length;
	const columnWidths = [];
	let bodyHeight = 0;
	block.branches.forEach((branch, column) => {
		const columnInsets = insetsOfParallelColumn(insets, column, count);
		const size = measureBody(context, branch.id, branch.body, at, columnInsets);
		columnWidths.push(size.width);
		bodyHeight = Math.max(bodyHeight, size.height);
	});
	const textWidth = block.text === "" ? 0 : text.width + 2 * padX$1 + 2 * parallelBand$1;
	return {
		kind: "parallel",
		text,
		topHeight,
		columnWidths,
		width: Math.max(textWidth, 2 * parallelBand$1 + blockMinWidth, sum(columnWidths)),
		height: topHeight + bodyHeight + parallelBand$1
	};
}
/** The smallest width of a branch column: its sequence, or its label plus room (02-layout 1.4). */
function columnWidth(sequenceWidth, label) {
	return Math.max(sequenceWidth, measureLine(label, fontSizes.secondary) + labelRoom);
}
function measureIf(context, block, at, insets) {
	const text = measureText(block.text);
	const headHeight = text.height + 2 * padY$1 + geometry["size.if-label"];
	const headWidth = text.width + 2 * padX$1 + geometry["size.if-head-extra"];
	const labels = [block.yes.label ?? drawingMessage(context.locale, "if.yes"), block.no.label ?? drawingMessage(context.locale, "if.no")];
	const yes = measureBody(context, block.yes.id, block.yes.body, at, insetsOfColumn(insets, 0, 2));
	const no = measureBody(context, block.no.id, block.no.body, at, insetsOfColumn(insets, 1, 2));
	const branchWidths = [columnWidth(yes.width, labels[0]), columnWidth(no.width, labels[1])];
	return {
		kind: "if",
		text,
		headHeight,
		labels,
		branchWidths,
		width: Math.max(headWidth, branchWidths[0] + branchWidths[1]),
		height: headHeight + Math.max(yes.height, no.height)
	};
}
function measureCase(context, block, at, insets) {
	const text = measureText(block.text);
	const headHeight = text.height + 2 * padY$1 + geometry["size.case-label"];
	const headWidth = text.width + 2 * padX$1 + geometry["size.case-head-extra"];
	const labels = [];
	const columnWidths = [];
	let bodyHeight = 0;
	const columns = block.arms.length + 1;
	block.arms.forEach((arm, column) => {
		const armInsets = insetsOfColumn(insets, column, columns);
		const size = measureBody(context, arm.id, arm.body, at, armInsets);
		labels.push(arm.label);
		columnWidths.push(columnWidth(size.width, arm.label));
		bodyHeight = Math.max(bodyHeight, size.height);
	});
	const defaultLabel = block.otherwise?.label ?? drawingMessage(context.locale, "case.default");
	const defaultSize = block.otherwise ? measureBody(context, block.otherwise.id, block.otherwise.body, at, insetsOfColumn(insets, columns - 1, columns)) : emptyBlockSize;
	labels.push(defaultLabel);
	columnWidths.push(columnWidth(defaultSize.width, defaultLabel));
	bodyHeight = Math.max(bodyHeight, defaultSize.height);
	return {
		kind: "case",
		text,
		headHeight,
		labels,
		columnWidths,
		width: Math.max(headWidth, sum(columnWidths)),
		height: headHeight + bodyHeight
	};
}
function measureCall(context, block, at) {
	const parts = callParts(context.words, block);
	const inside = openedInside(context, block, at);
	if (inside !== null && block.target.kind === "local") {
		const method = context.words.diagrams.get(block.target.diagram);
		if (method !== void 0) {
			const inner = measureSeq(context, method.body, inside, insetsOfFrame(peekInset));
			const words = measureLine(parts.before + parts.name + parts.after, fontSizes.secondary);
			return {
				kind: "peek",
				...parts,
				inside,
				body: method.body,
				width: Math.max(inner.width, bandTextWidth(words)),
				height: band$1 + inner.height
			};
		}
	}
	const width = measureLine(parts.before) + measureLine(parts.name) + measureLine(parts.after) + 2 * padX$1 + 2 * callBar$1;
	return {
		kind: "call",
		...parts,
		width,
		height: line + 2 * padY$1
	};
}
/**
* Places a sequence in its box. Every block gets the full width. When the box is taller than the
* blocks, the leftover height is shared equally and the last item takes the remainder
* (02-layout 1.3, UX SB1). Framed items sit `insets` inside (02-layout 1.6).
*/
function placeSeq(context, seq, box, at, insets, isBranch) {
	const items = itemsOf(context, seq, at);
	const [only] = items;
	placeItems(context, items, box, at, insets, isBranch && items.length === 1 && only?.kind === "block" && isEmptyBlock(only.block));
}
function placeItems(context, items, box, at, insets, isEmptyBranch) {
	const count = items.length;
	const framed = items.map((item) => isFramed(context, item, at));
	let needed = 0;
	items.forEach((item, index) => {
		needed += itemHeight(context, item, at);
		if (framed[index] === true && framed[index - 1] === true) needed += gapBetweenFrames;
	});
	if (framed[count - 1] === true) needed += insets.bottom;
	const each = Math.floor(Math.max(0, box.height - needed) / count);
	let y = box.y;
	items.forEach((item, index) => {
		const isFrame = framed[index] === true;
		if (isFrame && framed[index - 1] === true) y += gapBetweenFrames;
		const isLast = index === count - 1;
		const height = isLast ? box.y + box.height - y - (isFrame ? insets.bottom : 0) : itemHeight(context, item, at) + each;
		const left = isFrame ? insets.left : 0;
		const right = isFrame ? insets.right : 0;
		const itemBox = {
			x: box.x + left,
			y,
			width: box.width - left - right,
			height
		};
		if (item.kind === "block") placeBlock(context, item.block, itemBox, at, isEmptyBranch, insetsOfItem(insets, isLast));
		else placeFold(context, item.fold, item.items, itemBox, at);
		y += height;
	});
}
function itemHeight(context, item, at) {
	if (item.kind === "block") return measured(context, screenId(at.prefix, item.block.id)).height;
	return foldMeasured(context, item.fold.screenId).height;
}
function isEmptyBlock(block) {
	return block?.kind === "process" && block.text === "";
}
function measured(context, id) {
	const measure = context.measures.get(id);
	if (measure === void 0) throw new Error(`Layout: block ${id} was not measured`);
	return measure;
}
function foldMeasured(context, id) {
	const measure = context.folds.get(id);
	if (measure === void 0) throw new Error(`Layout: fold region ${id} was not measured`);
	return measure;
}
function placeFold(context, fold, items, box, at) {
	const measure = foldMeasured(context, fold.screenId);
	context.boxes.set(fold.screenId, box);
	if (measure.kind === "cell") {
		context.nodes.push({
			kind: "foldCell",
			id: fold.screenId,
			box,
			name: placedText(measure.name),
			isNamed: measure.isNamed
		});
		context.regions.push({
			kind: "fold",
			foldId: fold.screenId,
			isFolded: true,
			box
		}, toggle("fold", fold.screenId, false, box, measure.name.height + 2 * padY$1));
		for (const block of fold.blocks) hide(context, block, at.prefix, box);
		return;
	}
	const bandBox = {
		x: box.x,
		y: box.y,
		width: box.width,
		height: band$1
	};
	context.regions.push({
		kind: "fold",
		foldId: fold.screenId,
		isFolded: false,
		box: bandBox
	}, toggle("fold", fold.screenId, true, bandBox, band$1));
	placeItems(context, items, {
		x: box.x,
		y: box.y + band$1,
		width: box.width,
		height: box.height - band$1
	}, at, insetsOfFrame(nestInset), false);
	context.nodes.push({
		kind: "foldFrame",
		id: fold.screenId,
		box,
		band: bandBox,
		name: measure.name,
		isNamed: measure.isNamed
	});
}
/** The click box of a fold triangle at the left of a band or a folded cell. */
function toggle(what, target, isOpen, box, height) {
	return {
		kind: "toggle",
		what,
		target,
		isOpen,
		box: {
			x: box.x + 1,
			y: box.y,
			width: toggleWidth,
			height: Math.min(height, box.height)
		}
	};
}
/**
* Gives a block hidden in a folded branch, loop body or region (and everything in it) the box of
* what is drawn in its place, so selecting it outlines that (02-layout 1.1).
*/
function hide(context, block, prefix, box) {
	context.boxes.set(screenId(prefix, block.id), box);
	for (const inner of innerOwners(block)) {
		context.boxes.set(screenId(prefix, inner.owner), box);
		for (const child of inner.seq.blocks) hide(context, child, prefix, box);
	}
}
/** The sequences inside a block with the ids that own them (branches; a loop owns its body). */
function innerOwners(block) {
	switch (block.kind) {
		case "process":
		case "exit":
		case "call": return [];
		case "parallel": return block.branches.map((branch) => ({
			owner: branch.id,
			seq: branch.body
		}));
		case "if": return [{
			owner: block.yes.id,
			seq: block.yes.body
		}, {
			owner: block.no.id,
			seq: block.no.body
		}];
		case "case": return [...block.arms, ...block.otherwise === null ? [] : [block.otherwise]].map((branch) => ({
			owner: branch.id,
			seq: branch.body
		}));
		case "while":
		case "doWhile":
		case "for":
		case "endless": return [{
			owner: block.id,
			seq: block.body
		}];
	}
}
function placeBlock(context, block, box, at, isEmptyBranch, insets) {
	const id = screenId(at.prefix, block.id);
	context.boxes.set(id, box);
	const measure = measured(context, id);
	switch (block.kind) {
		case "process":
			if (measure.kind === "process") {
				context.nodes.push({
					kind: "process",
					id,
					box,
					text: placedText(measure.text),
					isEmptyBranch
				});
				context.regions.push({
					kind: "block",
					blockId: id,
					box
				});
			}
			return;
		case "call":
			if (measure.kind === "call") {
				context.nodes.push({
					kind: "call",
					id,
					box,
					before: measure.before,
					name: measure.name,
					after: measure.after
				});
				context.regions.push({
					kind: "block",
					blockId: id,
					box
				});
			} else if (measure.kind === "peek") placePeek(context, id, box, measure);
			return;
		case "while":
		case "doWhile":
		case "for":
			if (measure.kind === "loop") placeLoop(context, block, box, measure, at, insets);
			return;
		case "exit":
			if (measure.kind === "exit") {
				context.nodes.push({
					kind: "exit",
					id,
					box,
					text: placedText(measure.text)
				});
				context.regions.push({
					kind: "block",
					blockId: id,
					box
				});
			}
			return;
		case "endless":
			placeEndless(context, block, box, at, insets);
			return;
		case "parallel":
			if (measure.kind === "parallel") placeParallel(context, block, box, measure, at, insets);
			return;
		case "if":
			if (measure.kind === "if") placeIf(context, block, box, measure, at, insets);
			return;
		case "case":
			if (measure.kind === "case") placeCase(context, block, box, measure, at, insets);
			return;
	}
}
/** An opened call block: its band on top, the called Method's blocks below (02-layout 1.6). */
function placePeek(context, id, box, measure) {
	const bandBox = {
		x: box.x,
		y: box.y,
		width: box.width,
		height: band$1
	};
	context.regions.push({
		kind: "peekBand",
		blockId: id,
		box: bandBox
	}, toggle("peek", id, true, bandBox, band$1));
	placeSeq(context, measure.body, {
		x: box.x,
		y: box.y + band$1,
		width: box.width,
		height: box.height - band$1
	}, measure.inside, insetsOfFrame(peekInset), false);
	context.nodes.push({
		kind: "peek",
		id,
		box,
		band: bandBox,
		before: measure.before,
		name: measure.name,
		after: measure.after
	});
}
function placedText(text) {
	return {
		lines: text.lines,
		width: text.width
	};
}
/**
* Places a branch's or loop's body: the row "⋯ n blocks" when it is folded, which the blocks
* inside then point at (02-layout 1.1), otherwise its sequence.
*/
function placeBody(context, owner, seq, box, at, isBranch, insets) {
	if (!isFoldedAt(context.shown.folded, at.prefix, owner)) {
		placeSeq(context, seq, box, at, insets, isBranch);
		return;
	}
	const id = screenId(at.prefix, owner);
	context.nodes.push({
		kind: "foldedSeq",
		id,
		box,
		text: foldedWords(context, seq)
	});
	context.regions.push({
		kind: "foldedSeq",
		owner: id,
		box
	});
	for (const block of seq.blocks) hide(context, block, at.prefix, box);
}
function placeLoop(context, block, box, measure, at, insets) {
	const id = screenId(at.prefix, block.id);
	const isBottom = block.kind === "doWhile";
	const headHeight = measure.headHeight;
	const head = {
		x: box.x,
		y: isBottom ? box.y + box.height - headHeight : box.y,
		width: box.width,
		height: headHeight
	};
	context.nodes.push({
		kind: "loop",
		id,
		loop: block.kind,
		box,
		head,
		text: placedText(measure.text)
	});
	context.regions.push({
		kind: "head",
		blockId: id,
		box: head
	});
	placeBody(context, block.id, block.body, {
		x: box.x + loopStrip,
		y: isBottom ? box.y : box.y + headHeight,
		width: box.width - loopStrip,
		height: box.height - headHeight
	}, at, false, insetsOfLoopBody(insets, block));
}
/**
* An endless loop (UX EL1): the three strips select the block; the body lies inside them and
* takes the extra height.
*/
function placeEndless(context, block, box, at, insets) {
	const id = screenId(at.prefix, block.id);
	context.nodes.push({
		kind: "endless",
		id,
		box
	});
	const bottom = box.y + box.height - loopStrip;
	context.regions.push({
		kind: "head",
		blockId: id,
		box: {
			...box,
			height: loopStrip
		}
	}, {
		kind: "head",
		blockId: id,
		box: {
			...box,
			width: loopStrip
		}
	}, {
		kind: "head",
		blockId: id,
		box: {
			...box,
			y: bottom,
			height: loopStrip
		}
	});
	placeBody(context, block.id, block.body, {
		x: box.x + loopStrip,
		y: box.y + loopStrip,
		width: box.width - loopStrip,
		height: box.height - 2 * loopStrip
	}, at, false, insetsOfEndlessBody(insets));
}
/**
* A parallel block (UX PB1): the bands and the branches between them, which take the extra
* height. The part of the top band above a branch selects that branch; the bottom band and the
* cut ends of the top band select the block (sketch M84 B1).
*/
function placeParallel(context, block, box, measure, at, insets) {
	const id = screenId(at.prefix, block.id);
	const top = {
		...box,
		height: measure.topHeight
	};
	const bottom = {
		...box,
		y: box.y + box.height - parallelBand$1,
		height: parallelBand$1
	};
	const widths = splitWidth(box.width, measure.columnWidths);
	const bodyY = top.y + top.height;
	const bodyHeight = bottom.y - bodyY;
	const columns = [];
	let x = box.x;
	block.branches.forEach((branch, index) => {
		const width = widths[index] ?? 0;
		columns.push({
			branchId: screenId(at.prefix, branch.id),
			column: {
				x,
				y: bodyY,
				width,
				height: bodyHeight
			}
		});
		x += width;
	});
	context.nodes.push({
		kind: "parallel",
		id,
		box,
		top,
		bottom,
		text: placedText(measure.text),
		columns
	});
	columns.forEach((column, index) => {
		const above = {
			...column.column,
			y: top.y,
			height: top.height
		};
		context.regions.push(branchLabelRegion(id, column.branchId, index, above));
	});
	const cut = Math.min(parallelBand$1, Math.floor(box.width / 2));
	context.regions.push({
		kind: "head",
		blockId: id,
		box: bottom
	}, {
		kind: "head",
		blockId: id,
		box: {
			...top,
			width: cut
		}
	}, {
		kind: "head",
		blockId: id,
		box: {
			...top,
			x: top.x + top.width - cut,
			width: cut
		}
	});
	block.branches.forEach((branch, index) => {
		const column = columns[index]?.column;
		if (column !== void 0) placeBranch(context, branch, column, at, insetsOfParallelColumn(insets, index, block.branches.length));
	});
}
/**
* Splits a width among columns in proportion to their smallest widths; the last column takes the
* remainder so the total stays exact (02-layout 1.4).
*/
function splitWidth(total, minimums) {
	const minimumSum = sum(minimums);
	const extra = total - minimumSum;
	const widths = [];
	let used = 0;
	minimums.forEach((minimum, index) => {
		const width = index === minimums.length - 1 ? total - used : Math.round(minimum + extra * minimum / minimumSum);
		widths.push(width);
		used += width;
	});
	return widths;
}
function labelRow(column, head, rowHeight) {
	return {
		x: column.x,
		y: head.y + head.height - rowHeight,
		width: column.width,
		height: rowHeight
	};
}
function placeIf(context, block, box, measure, at, insets) {
	const id = screenId(at.prefix, block.id);
	const head = {
		x: box.x,
		y: box.y,
		width: box.width,
		height: measure.headHeight
	};
	const [yesWidth = 0] = splitWidth(box.width, measure.branchWidths);
	const bodyY = box.y + measure.headHeight;
	const bodyHeight = box.height - measure.headHeight;
	const yesBox = {
		x: box.x,
		y: bodyY,
		width: yesWidth,
		height: bodyHeight
	};
	const noBox = {
		x: box.x + yesWidth,
		y: bodyY,
		width: box.width - yesWidth,
		height: bodyHeight
	};
	const yes = {
		text: measure.labels[0],
		column: yesBox
	};
	const no = {
		text: measure.labels[1],
		column: noBox
	};
	context.nodes.push({
		kind: "if",
		id,
		box,
		head,
		text: placedText(measure.text),
		splitX: noBox.x,
		yes,
		no
	});
	context.regions.push({
		kind: "head",
		blockId: id,
		box: head
	});
	const rowHeight = geometry["size.if-label"];
	context.regions.push(branchLabelRegion(id, screenId(at.prefix, block.yes.id), 0, labelRow(yesBox, head, rowHeight)), branchLabelRegion(id, screenId(at.prefix, block.no.id), 1, labelRow(noBox, head, rowHeight)));
	placeBranch(context, block.yes, yesBox, at, insetsOfColumn(insets, 0, 2));
	placeBranch(context, block.no, noBox, at, insetsOfColumn(insets, 1, 2));
}
function branchLabelRegion(blockId, branchId, index, box) {
	return {
		kind: "branchLabel",
		blockId,
		branchId,
		index,
		box
	};
}
function placeBranch(context, branch, box, at, insets) {
	context.boxes.set(screenId(at.prefix, branch.id), box);
	placeBody(context, branch.id, branch.body, box, at, true, insets);
}
function placeCase(context, block, box, measure, at, insets) {
	const id = screenId(at.prefix, block.id);
	const head = {
		x: box.x,
		y: box.y,
		width: box.width,
		height: measure.headHeight
	};
	const widths = splitWidth(box.width, measure.columnWidths);
	const bodyY = box.y + measure.headHeight;
	const bodyHeight = box.height - measure.headHeight;
	const branches = [...block.arms, block.otherwise];
	const columns = [];
	let x = box.x;
	branches.forEach((branch, index) => {
		const width = widths[index] ?? 0;
		const column = {
			x,
			y: bodyY,
			width,
			height: bodyHeight
		};
		columns.push({
			branchId: branch === null ? null : screenId(at.prefix, branch.id),
			isDefault: index === branches.length - 1,
			label: {
				text: measure.labels[index] ?? "",
				column
			}
		});
		x += width;
	});
	context.nodes.push({
		kind: "case",
		id,
		box,
		head,
		text: placedText(measure.text),
		columns
	});
	context.regions.push({
		kind: "head",
		blockId: id,
		box: head
	});
	const rowHeight = geometry["size.case-label"];
	columns.forEach((column, index) => {
		context.regions.push(branchLabelRegion(id, column.branchId, index, labelRow(column.label.column, head, rowHeight)));
	});
	branches.forEach((branch, index) => {
		const column = columns[index]?.label.column;
		if (column === void 0) return;
		if (branch === null) {
			context.nodes.push({
				kind: "missingDefault",
				caseId: id,
				box: column
			});
			context.regions.push({
				kind: "missingDefault",
				blockId: id,
				box: column
			});
		} else placeBranch(context, branch, column, at, insetsOfColumn(insets, index, branches.length));
	});
}
function sum(values) {
	let total = 0;
	for (const value of values) total += value;
	return total;
}
// ../../packages/core/src/render/build-scene.ts
/**
* The font family list of the drawing: the bundled block font first, then fonts likely to be
* installed, so text still fits its box where the embedded font is not loaded (R-FMT-07).
*/
var drawingFontFamily = [
	`'${blockFont.familyName}'`,
	"D2Coding",
	"Consolas",
	"'Malgun Gothic'",
	"'Apple SD Gothic Neo'",
	"monospace"
].join(", ");
var padX = geometry["space.pad-x"];
var padY = geometry["space.pad-y"];
var labelInset = geometry["size.label-inset"];
var callBar = geometry["size.call-bar"];
/** The baseline sits this far above the bottom of its 18px line (the prototype's drawing). */
var baselineFromLineBottom = 5;
/** Structure lines are 1px (visual design 6). */
var structureWidth = 1;
/** The radius of the `∅` circle: 7px across, the slash 1px beyond it on each side (UX E1). */
var emptyRadius = 3.5;
var emptyStrokeWidth = 1.1;
/** The condition text sits this much higher than block text (the prototype's drawing). */
var conditionRaise = 2;
var band = geometry["size.band"];
var bandTextX = geometry["size.band-text-x"] + geometry["size.band-icon-room"];
var foldEdge = geometry["size.fold-edge"];
var foldIconRoom = geometry["size.fold-icon-room"];
var exitWedge = geometry["size.exit-wedge"];
var parallelBand = geometry["size.parallel-band"];
/**
* Builds the scene of a laid-out document with a theme. All color and shape decisions are made
* here, so a rendering backend only translates the result (ADR-0030). Block text is highlighted
* in the language `textKind` (R-LAY-07); `plain` is not.
*/
function buildScene(result, theme, textKind = "plain") {
	const elements = [];
	const ctx = {
		elements,
		colors: theme.colors,
		textKind
	};
	for (const node of result.nodes) paint(ctx, node);
	return {
		width: result.width,
		height: result.height,
		paper: theme.colors.paper,
		fontFamily: drawingFontFamily,
		elements
	};
}
/** The color token of each token kind (visual design 3.3); `null` keeps the text's color. */
var syntaxTokens = {
	keyword: "syntax.keyword",
	comment: "syntax.comment",
	string: "syntax.literal",
	number: "syntax.literal",
	other: null
};
/**
* The runs of each line of a block text, colored by the syntax of the document's language
* (R-LAY-07, ADR-0032). The text is tokenized as a whole, so a comment may span lines.
*/
function highlightedLines(ctx, text) {
	if (ctx.textKind === "plain") return text.lines.map((line) => line === "" ? [] : [{
		text: line,
		weight: 400
	}]);
	return tokenLines(tokenize(text.lines.join("\n"), ctx.textKind)).map((tokens) => tokens.map((token) => {
		const color = syntaxTokens[token.kind];
		return color === null ? {
			text: token.text,
			weight: 400
		} : {
			text: token.text,
			weight: 400,
			fill: ctx.colors[color]
		};
	}));
}
function paint(ctx, node) {
	const colors = ctx.colors;
	switch (node.kind) {
		case "process":
			rect(ctx, node.id, node.box, colors["block.process"]);
			blockText(ctx, node.id, node.text, node.box.x + padX, node.box.y + padY, ctx.colors["text.primary"]);
			if (node.isEmptyBranch) emptyMark(ctx, node.id, node.box);
			return;
		case "diagramHead":
			diagramHead(ctx, node);
			return;
		case "missingDefault":
			rect(ctx, node.caseId, node.box, colors["block.process"]);
			emptyMark(ctx, node.caseId, node.box);
			return;
		case "call":
			call(ctx, node);
			return;
		case "loop":
			rect(ctx, node.id, node.box, colors["block.loop"]);
			blockText(ctx, node.id, node.text, node.head.x + padX, node.head.y + padY, ctx.colors["text.primary"]);
			return;
		case "endless":
			rect(ctx, node.id, node.box, colors["block.loop"]);
			return;
		case "exit":
			exit(ctx, node);
			return;
		case "parallel":
			parallel(ctx, node);
			return;
		case "if":
			ifHead(ctx, node);
			return;
		case "case":
			caseHead(ctx, node);
			return;
		case "foldedSeq":
			foldedSeq(ctx, node);
			return;
		case "foldCell":
			foldCell(ctx, node);
			return;
		case "foldFrame":
			foldFrame(ctx, node);
			return;
		case "peek":
			peek(ctx, node);
			return;
	}
}
/** Slanted text for what has no name of its own yet (visual design 4.2). */
function slant(isNamed) {
	return isNamed ? {} : { isItalic: true };
}
/**
* A folded branch or loop body: a pale cell with three dots and "n blocks" slanted in the muted
* color (visual design 7.1). The dots are shapes, so a viewer without the glyph still shows them.
*/
function foldedSeq(ctx, node) {
	const colors = ctx.colors;
	const { box } = node;
	rect(ctx, node.id, box, colors["block.folded"]);
	const y = baseline(box.y + padY, 0) - 3.5;
	for (const dx of [
		3,
		7,
		11
	]) ctx.elements.push({
		kind: "circle",
		blockId: node.id,
		cx: box.x + padX + dx,
		cy: y,
		r: .6,
		stroke: colors["text.muted"],
		strokeWidth: 1.2
	});
	ctx.elements.push({
		kind: "text",
		blockId: node.id,
		x: box.x + padX + 16,
		y: baseline(box.y + padY, 0),
		anchor: "start",
		fontSize: fontSizes.secondary,
		fill: colors["text.muted"],
		runs: [{
			text: node.text,
			weight: 400,
			isItalic: true
		}],
		halo: null
	});
}
/** A folded fold region: a pale cell and its name; a default name is slanted (visual design 7.1). */
function foldCell(ctx, node) {
	const { box } = node;
	rect(ctx, node.id, box, ctx.colors["block.folded"]);
	const fill = ctx.colors["text.primary"];
	node.name.lines.forEach((text, index) => {
		if (text === "") return;
		ctx.elements.push({
			kind: "text",
			blockId: node.id,
			x: box.x + foldIconRoom,
			y: baseline(box.y + padY, index),
			anchor: "start",
			fontSize: fontSizes.body,
			fill,
			runs: [{
				text,
				weight: 400,
				...slant(node.isNamed)
			}],
			halo: null
		});
	});
}
/**
* An unfolded fold region with name bands on: the name band on top and a 3px border whose middle
* is 1px inside the box, so it starts on the same pixel line as the thin lines (visual design 6,
* 9.1). Painted after the blocks inside, over their outer lines.
*/
function foldFrame(ctx, node) {
	const colors = ctx.colors;
	const { box, band: bandBox } = node;
	ctx.elements.push({
		kind: "rect",
		blockId: node.id,
		x: bandBox.x,
		y: bandBox.y,
		width: bandBox.width,
		height: bandBox.height,
		fill: colors["fold.band"],
		stroke: colors["line.structure"],
		strokeWidth: structureWidth
	});
	const name = node.name.lines[0] ?? "";
	if (name !== "") ctx.elements.push({
		kind: "text",
		blockId: node.id,
		x: bandBox.x + bandTextX,
		y: bandBox.y + band - baselineFromLineBottom,
		anchor: "start",
		fontSize: fontSizes.secondary,
		fill: colors["fold.name"],
		runs: [{
			text: name,
			weight: 600,
			...slant(node.isNamed)
		}],
		halo: null
	});
	const offset = (foldEdge - 1) / 2;
	ctx.elements.push({
		kind: "rect",
		blockId: node.id,
		x: box.x + offset,
		y: box.y + offset,
		width: box.width - 2 * offset,
		height: box.height - 2 * offset,
		fill: "none",
		stroke: colors["fold.edge"],
		strokeWidth: foldEdge
	});
}
/**
* An opened call block (visual design 6, UX Q15-a): the shape of an unfolded fold region in the
* violet colors. The band with the call's text on top and a 3px border whose middle is 1px inside
* the box. The double bars are not drawn while it is open. Painted after the blocks inside.
*/
function peek(ctx, node) {
	const colors = ctx.colors;
	const { box, band: bandBox } = node;
	ctx.elements.push({
		kind: "rect",
		blockId: node.id,
		x: bandBox.x,
		y: bandBox.y,
		width: bandBox.width,
		height: bandBox.height,
		fill: colors["peek.band"],
		stroke: colors["line.structure"],
		strokeWidth: structureWidth
	});
	const runs = [
		{
			text: node.before,
			weight: 400
		},
		{
			text: node.name,
			weight: 600
		},
		{
			text: node.after,
			weight: 400
		}
	].filter((run) => run.text !== "");
	ctx.elements.push({
		kind: "text",
		blockId: node.id,
		x: bandBox.x + bandTextX,
		y: bandBox.y + band - baselineFromLineBottom,
		anchor: "start",
		fontSize: fontSizes.secondary,
		fill: colors["peek.name"],
		runs,
		halo: null
	});
	const offset = (foldEdge - 1) / 2;
	ctx.elements.push({
		kind: "rect",
		blockId: node.id,
		x: box.x + offset,
		y: box.y + offset,
		width: box.width - 2 * offset,
		height: box.height - 2 * offset,
		fill: "none",
		stroke: colors["peek.edge"],
		strokeWidth: foldEdge
	});
}
/**
* The header of a diagram (visual design principle 2, 02-layout 1.5). Shape: the Event's hat
* rises on the left, the Method's low arch spans the width (the prototype's curves). Title: a
* muted label, the bold name and a 1px rule, on the paper.
*/
function diagramHead(ctx, node) {
	const colors = ctx.colors;
	const { x, y, width: w, height: h } = node.box;
	if (node.style === "title") {
		const tag = geometry["size.title-tag"];
		ctx.elements.push({
			kind: "text",
			blockId: node.id,
			x,
			y: y + tag - 4,
			anchor: "start",
			fontSize: fontSizes.secondary,
			fill: colors["text.muted"],
			runs: [{
				text: headLabel(node.headKind),
				weight: 400
			}],
			halo: null
		});
		node.text.lines.forEach((line, index) => {
			if (line === "") return;
			ctx.elements.push({
				kind: "text",
				blockId: node.id,
				x,
				y: baseline(y + tag, index),
				anchor: "start",
				fontSize: fontSizes.body,
				fill: colors["text.primary"],
				runs: [{
					text: line,
					weight: 600
				}],
				halo: null
			});
		});
		polyline(ctx, node.id, [[x, y + h], [x + w, y + h]]);
		return;
	}
	const top = y + geometry["size.hat"];
	const segments = node.headKind === "method" ? [
		{
			kind: "move",
			to: [x, top]
		},
		{
			kind: "curve",
			c1: [x + w * .2, y + 1],
			c2: [x + w * .8, y + 1],
			to: [x + w, top]
		},
		{
			kind: "line",
			to: [x + w, y + h]
		},
		{
			kind: "line",
			to: [x, y + h]
		}
	] : hatSegments(x, y, w, h, top);
	ctx.elements.push({
		kind: "path",
		blockId: node.id,
		segments,
		fill: node.headKind === "method" ? colors["block.call"] : colors["block.event"],
		stroke: colors["line.structure"],
		strokeWidth: structureWidth
	});
	blockText({
		...ctx,
		textKind: "plain"
	}, node.id, node.text, x + padX, top + padY, colors["text.primary"]);
}
/** The Event hat: a bump `min(size.hat-w, 45%)` wide on the left, then the flat top. */
function hatSegments(x, y, w, h, top) {
	const hat = Math.min(geometry["size.hat-w"], w * .45);
	return [
		{
			kind: "move",
			to: [x, top]
		},
		{
			kind: "curve",
			c1: [x + 22, y - 2],
			c2: [x + hat - 22, y - 2],
			to: [x + hat, top]
		},
		{
			kind: "line",
			to: [x + w, top]
		},
		{
			kind: "line",
			to: [x + w, y + h]
		},
		{
			kind: "line",
			to: [x, y + h]
		}
	];
}
function call(ctx, node) {
	const colors = ctx.colors;
	const { box } = node;
	rect(ctx, node.id, box, colors["block.call"]);
	for (const x of [box.x + callBar, box.x + box.width - callBar]) ctx.elements.push({
		kind: "polyline",
		blockId: node.id,
		points: [[x, box.y], [x, box.y + box.height]],
		stroke: colors["line.structure"],
		strokeWidth: structureWidth,
		dash: null,
		isRoundCap: false
	});
	const runs = [
		{
			text: node.before,
			weight: 400
		},
		{
			text: node.name,
			weight: 600
		},
		{
			text: node.after,
			weight: 400
		}
	].filter((run) => run.text !== "");
	ctx.elements.push({
		kind: "text",
		blockId: node.id,
		x: box.x + padX + callBar,
		y: baseline(box.y + padY, 0),
		anchor: "start",
		fontSize: fontSizes.body,
		fill: ctx.colors["text.primary"],
		runs,
		halo: null
	});
}
/** An exit block (UX XB1): the box, a wedge whose tip is on the left edge, the text after it. */
function exit(ctx, node) {
	const { box } = node;
	rect(ctx, node.id, box, ctx.colors["block.process"]);
	const wedge = Math.min(exitWedge, box.width);
	polyline(ctx, node.id, [
		[box.x + wedge, box.y],
		[box.x, box.y + box.height / 2],
		[box.x + wedge, box.y + box.height]
	]);
	blockText(ctx, node.id, node.text, box.x + exitWedge + padX, box.y + padY, ctx.colors["text.primary"]);
}
/**
* A parallel block (UX PB1): the box in the loop color, the ends of the top and bottom bands cut
* slanting, and the text centered in the top band. The branches are painted over the inside.
*/
function parallel(ctx, node) {
	const { box, top, bottom } = node;
	rect(ctx, node.id, box, ctx.colors["block.loop"]);
	const cut = Math.min(parallelBand, box.width / 2);
	const right = box.x + box.width;
	const end = box.y + box.height;
	polyline(ctx, node.id, [[box.x + cut, box.y], [box.x, top.y + top.height]]);
	polyline(ctx, node.id, [[right - cut, box.y], [right, top.y + top.height]]);
	polyline(ctx, node.id, [[box.x, bottom.y], [box.x + cut, end]]);
	polyline(ctx, node.id, [[right, bottom.y], [right - cut, end]]);
	const x = box.x + box.width / 2;
	highlightedLines(ctx, node.text).forEach((runs, index) => {
		if (runs.length === 0) return;
		ctx.elements.push({
			kind: "text",
			blockId: node.id,
			x,
			y: baseline(top.y + padY, index),
			anchor: "middle",
			fontSize: fontSizes.body,
			fill: ctx.colors["text.primary"],
			runs,
			halo: null
		});
	});
}
function ifHead(ctx, node) {
	const colors = ctx.colors;
	const { head } = node;
	rect(ctx, node.id, head, colors["block.branch"]);
	polyline(ctx, node.id, [
		[head.x, head.y],
		[node.splitX, head.y + head.height],
		[head.x + head.width, head.y]
	]);
	condition(ctx, node.id, node.text, head, node.splitX, ctx.colors["text.primary"]);
	branchLabel(ctx, node.id, node.yes, head, "start");
	branchLabel(ctx, node.id, node.no, head, "end");
}
function caseHead(ctx, node) {
	const colors = ctx.colors;
	const { head, columns } = node;
	const defaultX = columns[columns.length - 1]?.label.column.x ?? head.x;
	const bottom = head.y + head.height;
	rect(ctx, node.id, head, colors["block.branch"]);
	if (defaultX === head.x) polyline(ctx, node.id, [[head.x + head.width, head.y], [head.x, bottom]]);
	else {
		polyline(ctx, node.id, [
			[head.x, head.y],
			[defaultX, bottom],
			[head.x + head.width, head.y]
		]);
		for (const column of columns.slice(1, -1)) {
			const x = column.label.column.x;
			const y = head.y + head.height * (x - head.x) / (defaultX - head.x);
			polyline(ctx, node.id, [[x, y], [x, bottom]]);
		}
	}
	condition(ctx, node.id, node.text, head, defaultX, ctx.colors["text.primary"]);
	for (const column of columns) branchLabel(ctx, node.id, column.label, head, column.isDefault ? "end" : "start");
}
/**
* The condition is centered over the diagonals' vertex but kept inside the header's padding.
* A background-colored halo hides the diagonals where a long condition touches them (UX BH1).
*/
function condition(ctx, blockId, text, head, vertexX, fill) {
	const colors = ctx.colors;
	const half = text.width / 2;
	const x = Math.min(Math.max(vertexX, head.x + half + padX), head.x + head.width - half - padX);
	const top = head.y + padY - conditionRaise;
	highlightedLines(ctx, text).forEach((runs, index) => {
		if (runs.length === 0) return;
		ctx.elements.push({
			kind: "text",
			blockId,
			x,
			y: baseline(top, index),
			anchor: "middle",
			fontSize: fontSizes.body,
			fill,
			runs,
			halo: {
				color: colors["block.branch"],
				width: geometry["size.text-halo"]
			}
		});
	});
}
function branchLabel(ctx, blockId, label, head, anchor) {
	if (label.text === "") return;
	const { column } = label;
	ctx.elements.push({
		kind: "text",
		blockId,
		x: anchor === "start" ? column.x + labelInset : column.x + column.width - labelInset,
		y: head.y + head.height - baselineFromLineBottom,
		anchor,
		fontSize: fontSizes.secondary,
		fill: ctx.colors["text.secondary"],
		runs: [{
			text: label.text,
			weight: 400
		}],
		halo: null
	});
}
function blockText(ctx, blockId, text, x, top, fill) {
	highlightedLines(ctx, text).forEach((runs, index) => {
		if (runs.length === 0) return;
		ctx.elements.push({
			kind: "text",
			blockId,
			x,
			y: baseline(top, index),
			anchor: "start",
			fontSize: fontSizes.body,
			fill,
			runs,
			halo: null
		});
	});
}
/** The `∅` of an empty branch, centered in the cell (UX E1, R-LAY-09). */
function emptyMark(ctx, blockId, box) {
	const stroke = ctx.colors["text.muted"];
	const cx = box.x + box.width / 2;
	const cy = box.y + box.height / 2;
	const reach = 4.5;
	ctx.elements.push({
		kind: "circle",
		blockId,
		cx,
		cy,
		r: emptyRadius,
		stroke,
		strokeWidth: emptyStrokeWidth
	}, {
		kind: "polyline",
		blockId,
		points: [[cx - reach, cy + reach], [cx + reach, cy - reach]],
		stroke,
		strokeWidth: emptyStrokeWidth,
		dash: null,
		isRoundCap: true
	});
}
function rect(ctx, blockId, box, fill) {
	ctx.elements.push({
		kind: "rect",
		blockId,
		x: box.x,
		y: box.y,
		width: box.width,
		height: box.height,
		fill,
		stroke: ctx.colors["line.structure"],
		strokeWidth: structureWidth
	});
}
function polyline(ctx, blockId, points) {
	ctx.elements.push({
		kind: "polyline",
		blockId,
		points,
		stroke: ctx.colors["line.structure"],
		strokeWidth: structureWidth,
		dash: null,
		isRoundCap: false
	});
}
/** The baseline of line `index` of a text whose first line starts at `top`. */
function baseline(top, index) {
	return top + (index + 1) * 18 - baselineFromLineBottom;
}
// ../../packages/core/src/render/theme.ts
/** The primitive palette (visual design 3.2). Colors with no meaning of their own. */
var palette = {
	"ink.900": "#151a22",
	"ink.700": "#343b48",
	"ink.600": "#4b5567",
	"ink.500": "#5a6476",
	"slate.500": "#5b77ad",
	"blue.700": "#1f45d6",
	"blue.600": "#2c55c9",
	"blue.500": "#4f74d6",
	"orange.600": "#d0500b",
	"red.700": "#b42318",
	"violet.700": "#5f459f",
	"violet.500": "#7a5fb8",
	"green.700": "#22702a",
	"amber.800": "#8a5a00",
	"fill.paper": "#ffffff",
	"fill.snow": "#fbfcfe",
	"fill.slate": "#edf0f5",
	"fill.sand": "#f6ebdc",
	"fill.mint": "#e2efdf",
	"fill.lilac": "#ebe7f4",
	"fill.sky": "#dce6f6",
	"fill.ice": "#e6ecfb",
	"fill.lilac-strong": "#ddd4ef",
	"ink.50": "#e6e9ef",
	"ink.200": "#b4bccb",
	"ink.300": "#a3acbc",
	"slate.300": "#7d93c4",
	"blue.200": "#a9c0ff",
	"blue.300": "#9db8ff",
	"blue.400": "#7f9cf0",
	"violet.300": "#a58be0",
	"violet.150": "#cdbcf5",
	"green.300": "#82c98a",
	"amber.300": "#e3b862",
	"night.paper": "#171a21",
	"night.snow": "#1c2029",
	"night.slate": "#232833",
	"night.sand": "#3a3226",
	"night.mint": "#213328",
	"night.lilac": "#2c2840",
	"night.sky": "#22304a",
	"night.ice": "#1f2a45",
	"night.lilac-strong": "#3a3158",
	black: "#000000",
	white: "#ffffff",
	"gray.100": "#f0f0f0",
	"gray.200": "#d6d6d6",
	"sky.200": "#9fd0ff",
	"sky.300": "#6cb6ff",
	"cyan.200": "#8fd0ff",
	"violet.200": "#d2a8ff",
	"violet.100": "#e3c9ff",
	"green.200": "#7ee08a",
	"yellow.300": "#ffd84d",
	"deep.snow": "#0f0f0f",
	"deep.sand": "#1f1a00",
	"deep.mint": "#002208",
	"deep.lilac": "#1c0d33",
	"deep.sky": "#00183d",
	"deep.lilac-strong": "#2a1747"
};
/** The light default theme (visual design 3.3). */
var light = {
	paper: "fill.paper",
	"block.process": "fill.slate",
	"block.branch": "fill.sand",
	"block.loop": "fill.sky",
	"block.event": "fill.mint",
	"block.call": "fill.lilac",
	"block.folded": "fill.snow",
	"line.structure": "slate.500",
	"text.primary": "ink.900",
	"text.secondary": "ink.600",
	"text.muted": "ink.500",
	"syntax.keyword": "blue.700",
	"syntax.comment": "green.700",
	"syntax.literal": "amber.800",
	"fold.edge": "blue.500",
	"fold.band": "fill.ice",
	"fold.name": "blue.600",
	"peek.edge": "violet.500",
	"peek.band": "fill.lilac-strong",
	"peek.name": "violet.700"
};
/** The dark default theme (visual design 3.5): the same hues on dark paper, AA kept. */
var dark = {
	paper: "night.paper",
	"block.process": "night.slate",
	"block.branch": "night.sand",
	"block.loop": "night.sky",
	"block.event": "night.mint",
	"block.call": "night.lilac",
	"block.folded": "night.snow",
	"line.structure": "slate.300",
	"text.primary": "ink.50",
	"text.secondary": "ink.200",
	"text.muted": "ink.300",
	"syntax.keyword": "blue.300",
	"syntax.comment": "green.300",
	"syntax.literal": "amber.300",
	"fold.edge": "blue.400",
	"fold.band": "night.ice",
	"fold.name": "blue.200",
	"peek.edge": "violet.300",
	"peek.band": "night.lilac-strong",
	"peek.name": "violet.150"
};
/** The high contrast theme (visual design 3.6, R-NFR-07): 7:1 for texts and lines. */
var highContrast = {
	paper: "black",
	"block.process": "black",
	"block.branch": "deep.sand",
	"block.loop": "deep.sky",
	"block.event": "deep.mint",
	"block.call": "deep.lilac",
	"block.folded": "deep.snow",
	"line.structure": "white",
	"text.primary": "white",
	"text.secondary": "gray.100",
	"text.muted": "gray.200",
	"syntax.keyword": "cyan.200",
	"syntax.comment": "green.200",
	"syntax.literal": "yellow.300",
	"fold.edge": "sky.300",
	"fold.band": "deep.sky",
	"fold.name": "sky.200",
	"peek.edge": "violet.200",
	"peek.band": "deep.lilac-strong",
	"peek.name": "violet.100"
};
/**
* Black and white print (visual design 9.3): every background white, lines and texts black,
* no syntax colors. Dotted lines and border widths stay, so the meaning stays (principle 2).
*/
var print = {
	paper: "white",
	"block.process": "white",
	"block.branch": "white",
	"block.loop": "white",
	"block.event": "white",
	"block.call": "white",
	"block.folded": "white",
	"line.structure": "black",
	"text.primary": "black",
	"text.secondary": "black",
	"text.muted": "black",
	"syntax.keyword": "black",
	"syntax.comment": "black",
	"syntax.literal": "black",
	"fold.edge": "black",
	"fold.band": "white",
	"fold.name": "black",
	"peek.edge": "black",
	"peek.band": "white",
	"peek.name": "black"
};
function theme(id, kind, mapping) {
	const colors = {};
	for (const token of Object.keys(mapping)) colors[token] = palette[mapping[token]];
	return {
		id,
		kind,
		colors
	};
}
/** The light default theme (visual design 3.3). New documents start with it. */
var defaultTheme = theme("default", "light", light);
/** Every theme, in the order the document settings list them (visual design 8). */
var themes = [
	defaultTheme,
	theme("dark", "dark", dark),
	theme("high-contrast", "dark", highContrast),
	theme("print", "light", print)
];
themes.map((t) => t.id);
/**
* Returns the theme for a theme name. Unknown names fall back to the default theme; the name is
* kept in the file as it is (01-file-format 3.3, ADR-0044).
*/
function themeFor(id) {
	return themes.find((t) => t.id === id) ?? defaultTheme;
}
// ../../packages/core/src/render/outline-text.ts
/**
* How far a slanted glyph leans: font units to the right per font unit above the baseline. The
* bundled font has no italic face (ADR-0034), so the screen shows italics as the browser's
* synthetic oblique; 1/4 (about 14 degrees) is the skew browsers use for it (UX SL1). An exact
* binary fraction, so the coordinates are the same on every engine (R-FMT-03).
*/
var italicShear = .25;
/**
* The glyphs of a text element, in place. When the font lacks one of its characters, that
* character is `missing`, or without it the result is `null`: then the element stays text,
* drawn by a fallback font (02-layout 2.1).
*/
function placeGlyphs(element, outlines, missing) {
	const scale = element.fontSize / outlines.unitsPerEm;
	const glyphs = [];
	for (const run of element.runs) for (const character of run.text) {
		const glyph = outlines.glyphOf(character.codePointAt(0) ?? 0) ?? missing ?? null;
		if (glyph === null) return null;
		glyphs.push({
			glyph,
			weight: run.weight,
			isItalic: run.isItalic === true,
			fill: run.fill ?? element.fill
		});
	}
	const width = glyphs.reduce((sum, { glyph }) => sum + glyph.advance, 0) * scale;
	let x = element.anchor === "start" ? element.x : element.anchor === "middle" ? element.x - width / 2 : element.x - width;
	return glyphs.map((unplaced) => {
		const placed = {
			...unplaced,
			x,
			y: element.y,
			scale
		};
		x += unplaced.glyph.advance * scale;
		return placed;
	});
}
/**
* A glyph's outline leaning about the baseline, in font units (y up): points on the baseline stay,
* so the text keeps its place and width.
*/
function slantedCommands(commands) {
	const lean = (x, y) => x + y * italicShear;
	return commands.map((command) => {
		switch (command.kind) {
			case "move":
			case "line": return {
				...command,
				x: lean(command.x, command.y)
			};
			case "quad": return {
				...command,
				cx: lean(command.cx, command.cy),
				x: lean(command.x, command.y)
			};
			case "close": return command;
		}
	});
}
/**
* The stroke width that makes a regular glyph look bold, as browsers do when a font has no bold
* face (synthetic bold: 1/24 of the size at 9px down to 1/32 at 36px). The bundled font is
* regular only (ADR-0034), so the screen shows bold text this way too.
*/
function syntheticBoldWidth(fontSize) {
	return fontSize * (1 / 24 + Math.min(1, Math.max(0, (fontSize - 9) / 27)) * (1 / 32 - 1 / 24));
}
/**
* The path data of placed glyphs in drawing coordinates (y down), numbers through `format`.
* Glyphs without an outline (a space) add nothing, slanted ones lean. `''` if nothing is drawn.
*/
function glyphPathData(glyphs, format) {
	const parts = [];
	for (const { glyph, x, y, scale, isItalic } of glyphs) {
		const point = (gx, gy) => `${format(x + gx * scale)} ${format(y - gy * scale)}`;
		for (const command of isItalic ? slantedCommands(glyph.commands) : glyph.commands) switch (command.kind) {
			case "move":
				parts.push(`M${point(command.x, command.y)}`);
				break;
			case "line":
				parts.push(`L${point(command.x, command.y)}`);
				break;
			case "quad":
				parts.push(`Q${point(command.cx, command.cy)} ${point(command.x, command.y)}`);
				break;
			case "close": parts.push("Z");
		}
	}
	return parts.join("");
}
// ../../packages/core/src/render/to-svg.ts
/**
* Writes a scene as SVG. Deterministic: the same scene gives the same text (R-FMT-03).
* The whole drawing is shifted by half a pixel so 1px lines on whole coordinates fill one pixel
* row (visual design 9.1).
*/
function toSvg(scene, options = {}) {
	const lines = [`<g class="ans-render" transform="translate(.5 .5)" font-family="${escapeAttribute$1(scene.fontFamily)}" style="font-kerning:none">`];
	for (const element of scene.elements) {
		const glyphs = element.kind === "text" && options.outlines !== void 0 ? placeGlyphs(element, options.outlines) : null;
		lines.push(element.kind === "text" && glyphs !== null ? outlinedTextToSvg(element, glyphs) : elementToSvg(element));
	}
	lines.push("</g>");
	return {
		width: scene.width,
		height: scene.height,
		viewBox: `0 0 ${formatNumber(scene.width)} ${formatNumber(scene.height)}`,
		paper: scene.paper,
		content: lines.join("\n")
	};
}
function elementToSvg(element) {
	switch (element.kind) {
		case "rect": return `<rect x="${formatNumber(element.x)}" y="${formatNumber(element.y)}" width="${formatNumber(element.width)}" height="${formatNumber(element.height)}" fill="${element.fill}" stroke="${element.stroke}" stroke-width="${formatNumber(element.strokeWidth)}" shape-rendering="crispEdges"/>`;
		case "polyline": return `<path d="${pathData(element.points)}" fill="none" stroke="${element.stroke}" stroke-width="${formatNumber(element.strokeWidth)}"` + (element.dash === null ? "" : ` stroke-dasharray="${formatNumber(element.dash[0])} ${formatNumber(element.dash[1])}"`) + (element.isRoundCap ? " stroke-linecap=\"round\"" : "") + "/>";
		case "path": return `<path d="${segmentData(element.segments)}" fill="${element.fill}" stroke="${element.stroke}" stroke-width="${formatNumber(element.strokeWidth)}"/>`;
		case "circle": return `<circle cx="${formatNumber(element.cx)}" cy="${formatNumber(element.cy)}" r="${formatNumber(element.r)}" fill="none" stroke="${element.stroke}" stroke-width="${formatNumber(element.strokeWidth)}"/>`;
		case "text": return textToSvg(element);
	}
}
function textToSvg(element) {
	const anchor = element.anchor === "start" ? "" : ` text-anchor="${element.anchor}"`;
	const halo = element.halo === null ? "" : ` stroke="${element.halo.color}" stroke-width="${formatNumber(2 * element.halo.width)}" stroke-linejoin="round" paint-order="stroke"`;
	return `<text x="${formatNumber(element.x)}" y="${formatNumber(element.y)}"${anchor} font-size="${formatNumber(element.fontSize)}" fill="${element.fill}"${halo} xml:space="preserve">${element.runs.map((run) => runToSvg(run, element.fill)).join("")}</text>`;
}
/**
* A text element as paths (R-FMT-10): its halo first (UX BH1, like `paint-order="stroke"`), then
* the glyphs. Bold glyphs get a stroke of the text color, as the browser's synthetic bold.
*/
function outlinedTextToSvg(element, glyphs) {
	const boldWidth = syntheticBoldWidth(element.fontSize);
	const stroked = (d, color, width, fill) => `<path d="${d}" fill="${fill}" stroke="${color}" stroke-width="${formatNumber(width)}" stroke-linejoin="round"/>`;
	const paths = (of) => ({
		regular: glyphPathData(of.filter((glyph) => glyph.weight === 400), formatNumber),
		bold: glyphPathData(of.filter((glyph) => glyph.weight !== 400), formatNumber)
	});
	const parts = [];
	if (element.halo !== null) {
		const { regular, bold } = paths(glyphs);
		const haloWidth = 2 * element.halo.width;
		if (regular !== "") parts.push(stroked(regular, element.halo.color, haloWidth, "none"));
		if (bold !== "") parts.push(stroked(bold, element.halo.color, haloWidth + boldWidth, "none"));
	}
	const fills = [...new Set(glyphs.map((glyph) => glyph.fill))];
	for (const fill of fills) {
		const { regular, bold } = paths(glyphs.filter((glyph) => glyph.fill === fill));
		if (regular !== "") parts.push(`<path d="${regular}" fill="${fill}"/>`);
		if (bold !== "") parts.push(stroked(bold, fill, boldWidth, fill));
	}
	return parts.join("\n");
}
function runToSvg(run, textFill) {
	const text = escapeText(run.text);
	const weight = run.weight === 400 ? "" : ` font-weight="${String(run.weight)}"`;
	const fill = run.fill === void 0 || run.fill === textFill ? "" : ` fill="${run.fill}"`;
	const style = run.isItalic === true ? " font-style=\"italic\"" : "";
	return weight === "" && fill === "" && style === "" ? text : `<tspan${weight}${fill}${style}>${text}</tspan>`;
}
function pathData(points) {
	return points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${formatNumber(x)} ${formatNumber(y)}`).join(" ");
}
function segmentData(segments) {
	const point = ([x, y]) => `${formatNumber(x)} ${formatNumber(y)}`;
	return `${segments.map((segment) => {
		switch (segment.kind) {
			case "move": return `M${point(segment.to)}`;
			case "line": return `L${point(segment.to)}`;
			case "curve": return `C${point(segment.c1)} ${point(segment.c2)} ${point(segment.to)}`;
		}
	}).join(" ")} Z`;
}
/**
* Formats a coordinate: at most two decimals, no trailing zeros, never `-0`. Two decimals are
* enough for half pixels and diagonal points, and keep the text stable (R-FMT-03).
*/
function formatNumber(value) {
	const rounded = Math.round(value * 100) / 100;
	return Object.is(rounded, -0) ? "0" : String(rounded);
}
var invalidXmlCharacters = /[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g;
function escapeText(text) {
	return text.replace(invalidXmlCharacters, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttribute$1(text) {
	return escapeText(text).replace(/"/g, "&quot;");
}
// ../../packages/core/src/render/used-code-points.ts
/**
* Returns the code points of all text in a scene, sorted ascending and without repeats.
* Fixed words such as branch labels are included, in the locale they were drawn in.
* With `outlines` (text as outlines, R-FMT-10), only the text that stays text counts: the text
* elements with a character the font lacks.
*/
function usedCodePoints(scene, outlines) {
	const codePoints = /* @__PURE__ */ new Set();
	for (const element of scene.elements) {
		if (element.kind !== "text") continue;
		if (outlines !== void 0 && placeGlyphs(element, outlines) !== null) continue;
		for (const run of element.runs) for (const character of run.text) {
			const codePoint = character.codePointAt(0);
			if (codePoint !== void 0) codePoints.add(codePoint);
		}
	}
	return [...codePoints].sort((a, b) => a - b);
}
// ../../packages/core/src/render/render-doc.ts
/** Runs the work untimed. */
var untimed = (_phase, run) => run();
/**
* Lays out and draws a document with the theme of its settings: layout → buildScene → toSvg.
* The fixed words are in the document's drawing language `settings.locale` (ADR-0041), and block
* text is highlighted in the language `settings.textKind` (R-LAY-07).
*/
function renderDoc(doc, time = untimed) {
	const result = time("layout", () => layout(doc));
	const { settings } = doc.content;
	const scene = time("scene", () => buildScene(result, themeFor(settings.theme), settings.textKind));
	return time("svg", () => ({
		layout: result,
		scene,
		svg: toSvg(scene),
		codePoints: usedCodePoints(scene)
	}));
}
/**
* What a saved file draws (ADR-0018): the rendering as shown, or with `outlines` its text as the
* bundled font's outlines (R-FMT-10, the document setting `textOutlines`). Then the subset font
* holds only the characters of text that stays text (characters the font lacks).
*/
function savedDrawing(rendering, outlines) {
	return outlines === null ? {
		svg: rendering.svg,
		codePoints: rendering.codePoints
	} : {
		svg: toSvg(rendering.scene, { outlines }),
		codePoints: usedCodePoints(rendering.scene, outlines)
	};
}
// ../../packages/core/src/model/invariants.ts
/**
* Checks invariants 1–7 of 01-model 3 and lists every violation (empty when the content is
* valid). Header name rules are not invariants and are not checked here.
*/
function checkInvariants(content) {
	const found = [];
	const report = (invariant, message, node) => {
		found.push(node === void 0 ? {
			invariant,
			message
		} : {
			invariant,
			message,
			node
		});
	};
	if (content.diagrams.length === 0) report(1, "the document has no diagram");
	const seen = /* @__PURE__ */ new Set();
	const note = (id) => {
		if (seen.has(id)) report(3, `id ${id} is used more than once`, id);
		seen.add(id);
	};
	const methods = new Set(content.diagrams.filter((d) => d.head?.kind === "method").map((d) => d.id));
	const checkSeq = (seq, owner) => {
		if (seq.blocks.length === 0) report(2, `the sequence of ${owner} has no blocks`, owner);
		for (const block of seq.blocks) checkBlock(block);
		checkFolds(seq, owner, report);
		for (const fold of seq.folds) note(fold.id);
	};
	const checkBlock = (block) => {
		note(block.id);
		switch (block.kind) {
			case "process":
			case "exit": return;
			case "if":
				if (!isObject(block.yes) || !isObject(block.no)) {
					report(4, `If ${block.id} does not have two branches`, block.id);
					return;
				}
				note(block.yes.id);
				checkSeq(block.yes.body, block.yes.id);
				note(block.no.id);
				checkSeq(block.no.body, block.no.id);
				return;
			case "case":
				if (block.arms.length === 0 && block.otherwise === null) report(4, `Case ${block.id} has no branch`, block.id);
				for (const arm of block.arms) {
					note(arm.id);
					checkSeq(arm.body, arm.id);
				}
				if (block.otherwise !== null) {
					note(block.otherwise.id);
					checkSeq(block.otherwise.body, block.otherwise.id);
				}
				return;
			case "while":
			case "doWhile":
			case "for":
			case "endless":
				checkSeq(block.body, block.id);
				return;
			case "parallel":
				if (block.branches.length === 0) report(4, `parallel ${block.id} has no branch`, block.id);
				for (const branch of block.branches) {
					note(branch.id);
					checkSeq(branch.body, branch.id);
				}
				return;
			case "call":
				for (const fold of block.siteFolds) note(fold.id);
				if (block.target.kind === "local" && !methods.has(block.target.diagram)) report(6, `call ${block.id} names ${block.target.diagram}, which is not a Method here`, block.id);
				return;
		}
	};
	for (const diagram of content.diagrams) {
		note(diagram.id);
		checkSeq(diagram.body, diagram.id);
		if (content.diagrams.length > 1 && isBlank(diagram)) report(7, `diagram ${diagram.id} has neither a header nor content`, diagram.id);
	}
	return found;
}
/** Whether a diagram has neither a header nor content: no header and one empty block. */
function isBlank(diagram) {
	const [only] = diagram.body.blocks;
	return diagram.head === null && diagram.body.blocks.length === 1 && only?.kind === "process" && only.text === "";
}
function checkFolds(seq, owner, report) {
	const position = new Map(seq.blocks.map((block, index) => [block.id, index]));
	const ranges = [];
	for (const fold of seq.folds) {
		const a = position.get(fold.first);
		const b = position.get(fold.last);
		if (a === void 0 || b === void 0) {
			report(5, `fold ${fold.id} on ${owner} names a block outside its sequence`, fold.id);
			continue;
		}
		if (a > b) {
			report(5, `fold ${fold.id} on ${owner} ends before it starts`, fold.id);
			continue;
		}
		for (const other of ranges) if (other.a === a && other.b === b) report(5, `folds ${other.id} and ${fold.id} have the same range`, fold.id);
		else if (other.a < a && a <= other.b && other.b < b || a < other.a && other.a <= b && b < other.b) report(5, `folds ${other.id} and ${fold.id} overlap without nesting`, fold.id);
		ranges.push({
			id: fold.id,
			a,
			b
		});
	}
}
function isObject(value) {
	return typeof value === "object" && value !== null;
}
// ../../packages/core/src/format/model-json.ts
/** The value of the `format` field. */
var formatName = "ariadne-nsd";
/**
* Serializes a document to model JSON (01-file-format 3.1): 2-space indent, LF, keys in the order
* of the table in 3.3, omitted fields left out. The same document always gives the same text.
* The view lists only ids that exist, in document order, so the order of folding does not matter.
*/
function serializeModelJson(doc, kept = {}) {
	return JSON.stringify(modelJson(doc, kept), null, 2);
}
/** The model JSON as a plain value, with keys in the order of 01-file-format 3.3. */
function modelJson(doc, kept) {
	const { settings } = doc.content;
	const textKind = settings.textKind === "plain" && kept.textKind !== void 0 ? kept.textKind : settings.textKind;
	const locale = kept.locale?.drawnIn === settings.locale ? kept.locale.written : settings.locale;
	return {
		format: formatName,
		version: 1,
		settings: {
			textKind,
			theme: settings.theme,
			headStyle: settings.headStyle,
			locale,
			...settings.textOutlines === true ? { textOutlines: true } : {}
		},
		diagrams: doc.content.diagrams.map(diagramJson),
		view: viewJson(doc)
	};
}
function diagramJson(diagram) {
	return {
		id: diagram.id,
		...diagram.head === null ? {} : { head: {
			kind: diagram.head.kind,
			text: diagram.head.text
		} },
		...seqJson(diagram.body)
	};
}
/** A sequence has no object of its own: its blocks go to `body` and its folds to `folds`. */
function seqJson(seq) {
	return {
		body: seq.blocks.map(blockJson),
		...seq.folds.length === 0 ? {} : { folds: seq.folds.map(foldJson) }
	};
}
function foldJson(fold) {
	return {
		id: fold.id,
		first: fold.first,
		last: fold.last,
		...fold.name === void 0 ? {} : { name: fold.name }
	};
}
function siteFoldJson(fold) {
	return {
		id: fold.id,
		via: [...fold.via],
		first: fold.first,
		last: fold.last,
		...fold.name === void 0 ? {} : { name: fold.name }
	};
}
function branchJson(branch) {
	return {
		id: branch.id,
		...branch.label === void 0 ? {} : { label: branch.label },
		...seqJson(branch.body)
	};
}
function armJson(arm) {
	return {
		id: arm.id,
		label: arm.label,
		...seqJson(arm.body)
	};
}
function blockJson(block) {
	switch (block.kind) {
		case "process":
		case "exit": return {
			id: block.id,
			kind: block.kind,
			text: block.text
		};
		case "endless": return {
			id: block.id,
			kind: block.kind,
			...seqJson(block.body)
		};
		case "parallel": return {
			id: block.id,
			kind: block.kind,
			text: block.text,
			branches: block.branches.map((branch) => ({
				id: branch.id,
				...seqJson(branch.body)
			}))
		};
		case "if": return {
			id: block.id,
			kind: block.kind,
			text: block.text,
			yes: branchJson(block.yes),
			no: branchJson(block.no)
		};
		case "case": return {
			id: block.id,
			kind: block.kind,
			text: block.text,
			arms: block.arms.map(armJson),
			...block.otherwise === null ? {} : { otherwise: branchJson(block.otherwise) }
		};
		case "while":
		case "doWhile":
		case "for": return {
			id: block.id,
			kind: block.kind,
			text: block.text,
			...seqJson(block.body)
		};
		case "call": return callJson(block);
	}
}
function callJson(call) {
	return {
		id: call.id,
		kind: call.kind,
		target: targetJson(call.target),
		args: call.args,
		result: call.result,
		...call.siteFolds.length === 0 ? {} : { siteFolds: call.siteFolds.map(siteFoldJson) }
	};
}
function targetJson(target) {
	switch (target.kind) {
		case "local": return {
			kind: target.kind,
			diagram: target.diagram
		};
		case "named": return {
			kind: target.kind,
			name: target.name
		};
	}
}
function viewJson(doc) {
	const { content, view } = doc;
	const folded = new Set(view.folded);
	return {
		folded: [...content.diagrams.flatMap((diagram) => [...seqFoldableIds(diagram.body, true)]).filter((id) => folded.has(id)), ...siteFoldedEntries(doc)],
		opened: existingPaths(content, view.opened),
		bands: view.bands,
		resultSymbol: view.resultSymbol
	};
}
// ../../packages/core/src/format/migrations.ts
/**
* Migrations by the version they read: the entry for `n` turns version `n` into `n + 1`.
* Opening applies them in order up to the current version. Version 1 is the first version, so
* there are none yet. Version 0 (the prototype) is never migrated (ADR-0035).
*/
var migrations = /* @__PURE__ */ new Map();
// ../../packages/core/src/format/model-values.ts
var blockKindSet = {
	process: true,
	if: true,
	case: true,
	while: true,
	doWhile: true,
	for: true,
	endless: true,
	exit: true,
	parallel: true,
	call: true
};
var headKindSet = {
	method: true,
	event: true
};
var headStyleSet = {
	title: true,
	shape: true
};
var resultSymbolSet = {
	"←": true,
	"=": true
};
var callTargetKindSet = {
	local: true,
	named: true
};
Object.keys(blockKindSet);
/** The kinds of a diagram header (`head.kind`). */
var headKinds = Object.keys(headKindSet);
/** How headers are drawn (`settings.headStyle`). */
var headStyles = Object.keys(headStyleSet);
/** The symbol between a call's result and the call (`view.resultSymbol`). */
var resultSymbols = Object.keys(resultSymbolSet);
Object.keys(callTargetKindSet);
// ../../packages/core/src/format/parse-model.ts
/** The check used when opening files: the model invariants 1–7 (01-model 3). No repair. */
var invariantCheck = (content) => {
	const violations = checkInvariants(content);
	return violations.length === 0 ? null : violations.map((v) => `${String(v.invariant)}: ${v.message}`).join("; ");
};
/** Fails with a reason and a detail. */
function openFailure(reason, detail) {
	return {
		ok: false,
		reason,
		detail
	};
}
/**
* Checks a parsed model JSON value and turns it into a document (01-file-format 5).
* Older versions are migrated one step at a time; newer versions are refused. Unknown keys are
* refused too, so that opening and saving never drops something silently (QA-04).
* `options.check` runs on the result; by default the model invariants (01-model 3). Tests of the
* format alone may pass another.
*/
function parseModel(value, options = {}) {
	const check = options.check ?? invariantCheck;
	if (!isRecord(value) || value.format !== "ariadne-nsd") return openFailure("damaged", `"format" is not "${formatName}"`);
	const { version } = value;
	if (!Number.isInteger(version) || typeof version !== "number" || version < 0) return openFailure("damaged", "\"version\" is not a whole number");
	if (version === 0) return openFailure("prototype", "version 0 is the prototype format (ADR-0035)");
	if (version > 1) return openFailure("newerVersion", `version ${String(version)} is newer than ${String(1)}`);
	let migrated = value;
	for (let from = version; from < 1; from += 1) {
		const migrate = migrations.get(from);
		if (migrate === void 0) return openFailure("damaged", `no migration from version ${String(from)}`);
		migrated = migrate(migrated);
	}
	const reader = {
		problem: null,
		locale: options.locale ?? "en"
	};
	const loaded = readDocument(reader, migrated);
	if (loaded === null) return openFailure("damaged", reader.problem ?? "unknown problem");
	const problem = check(loaded.doc.content);
	if (problem !== null) return openFailure("damaged", `invariant: ${problem}`);
	return {
		ok: true,
		value: loaded
	};
}
function fail$1(reader, at, message) {
	reader.problem ??= `${at}: ${message}`;
	return null;
}
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** Reads an object with exactly these keys allowed. */
function readObject(reader, at, value, allowed) {
	if (!isRecord(value)) return fail$1(reader, at, "is not an object");
	for (const key of Object.keys(value)) if (!allowed.includes(key)) return fail$1(reader, at, `unknown key "${key}"`);
	return value;
}
function readString(reader, at, value) {
	return typeof value === "string" ? value : fail$1(reader, at, "is not a string");
}
function readOptionalString(reader, at, fields, key) {
	if (!(key in fields)) return { ok: true };
	const value = readString(reader, `${at}.${key}`, fields[key]);
	return value === null ? { ok: false } : {
		ok: true,
		value
	};
}
/** Reads an id with the prefix of its kind (01-file-format 3.3): `d`, `b`, `r` or `f`. */
function readId(reader, at, value, prefix) {
	if (typeof value !== "string" || !new RegExp(`^${prefix}[1-9]\\d*$`).test(value)) return fail$1(reader, at, `is not an id like "${prefix}1"`);
	return value;
}
/** Reads a reference to a block id. References may dangle, so only the form is checked. */
function readBlockRef(reader, at, value) {
	return readId(reader, at, value, "b");
}
function readArray(reader, at, value, readItem) {
	if (!Array.isArray(value)) return fail$1(reader, at, "is not an array");
	const items = [];
	for (const [index, item] of value.entries()) {
		const read = readItem(item, `${at}[${String(index)}]`);
		if (read === null) return null;
		items.push(read);
	}
	return items;
}
/** Reads an array that may be left out when empty (01-file-format 3.3). */
function readOptionalArray(reader, at, fields, key, readItem) {
	return key in fields ? readArray(reader, `${at}.${key}`, fields[key], readItem) : [];
}
function readDocument(reader, value) {
	const fields = readObject(reader, "document", value, [
		"format",
		"version",
		"settings",
		"diagrams",
		"view"
	]);
	if (fields === null) return null;
	const settings = readSettings(reader, fields.settings);
	const diagrams = readArray(reader, "diagrams", fields.diagrams, (item, at) => readDiagram(reader, at, item));
	const view = readView(reader, fields.view);
	if (settings === null || diagrams === null || view === null) return null;
	return {
		doc: {
			content: {
				settings: settings.settings,
				diagrams
			},
			view
		},
		kept: settings.kept
	};
}
function readSettings(reader, value) {
	const fields = readObject(reader, "settings", value, [
		"textKind",
		"theme",
		"headStyle",
		"locale",
		"textOutlines"
	]);
	if (fields === null) return null;
	const { textOutlines } = fields;
	if (textOutlines !== void 0 && typeof textOutlines !== "boolean") return fail$1(reader, "settings.textOutlines", "is not true or false");
	const textKind = readString(reader, "settings.textKind", fields.textKind);
	const theme = readString(reader, "settings.theme", fields.theme);
	const headStyle = headStyles.find((style) => style === fields.headStyle);
	if (headStyle === void 0) return fail$1(reader, "settings.headStyle", "is not \"shape\" or \"title\"");
	const written = "locale" in fields ? readString(reader, "settings.locale", fields.locale) : reader.locale;
	if (textKind === null || theme === null || written === null) return null;
	const locale = knownLocale(written) ?? reader.locale;
	const known = isTextKind(textKind) ? textKind : null;
	return {
		settings: {
			textKind: known ?? "plain",
			theme,
			headStyle,
			locale,
			...textOutlines === true ? { textOutlines } : {}
		},
		kept: {
			...known === null ? { textKind } : {},
			...locale === written ? {} : { locale: {
				written,
				drawnIn: locale
			} }
		}
	};
}
function knownLocale(value) {
	return isLocale(value) ? value : null;
}
function readDiagram(reader, at, value) {
	const fields = readObject(reader, at, value, [
		"id",
		"head",
		"body",
		"folds"
	]);
	if (fields === null) return null;
	const id = readId(reader, `${at}.id`, fields.id, "d");
	const hasHead = "head" in fields;
	const head = hasHead ? readHead(reader, `${at}.head`, fields.head) : null;
	const body = readSeq(reader, at, fields);
	if (id === null || hasHead && head === null || body === null) return null;
	return {
		id,
		head,
		body
	};
}
function readHead(reader, at, value) {
	const fields = readObject(reader, at, value, ["kind", "text"]);
	if (fields === null) return null;
	const kind = headKinds.find((each) => each === fields.kind);
	if (kind === void 0) return fail$1(reader, `${at}.kind`, "is not \"event\" or \"method\"");
	const text = readString(reader, `${at}.text`, fields.text);
	return text === null ? null : {
		kind,
		text
	};
}
/** Reads the sequence spread over its owner: `body` (blocks) and `folds` (01-file-format 3.3). */
function readSeq(reader, at, fields) {
	const blocks = readArray(reader, `${at}.body`, fields.body, (item, itemAt) => readBlock(reader, itemAt, item));
	const folds = readOptionalArray(reader, at, fields, "folds", (item, itemAt) => readFold(reader, itemAt, item));
	if (blocks === null || folds === null) return null;
	return {
		blocks,
		folds
	};
}
function readFold(reader, at, value) {
	const fields = readObject(reader, at, value, [
		"id",
		"first",
		"last",
		"name"
	]);
	if (fields === null) return null;
	const id = readId(reader, `${at}.id`, fields.id, "f");
	const first = readBlockRef(reader, `${at}.first`, fields.first);
	const last = readBlockRef(reader, `${at}.last`, fields.last);
	const name = readOptionalString(reader, at, fields, "name");
	if (id === null || first === null || last === null || !name.ok) return null;
	return {
		id,
		first,
		last,
		...name.value === void 0 ? {} : { name: name.value }
	};
}
function readSiteFold(reader, at, value) {
	const fields = readObject(reader, at, value, [
		"id",
		"via",
		"first",
		"last",
		"name"
	]);
	if (fields === null) return null;
	const id = readId(reader, `${at}.id`, fields.id, "f");
	const via = readArray(reader, `${at}.via`, fields.via, (item, itemAt) => readBlockRef(reader, itemAt, item));
	const first = readBlockRef(reader, `${at}.first`, fields.first);
	const last = readBlockRef(reader, `${at}.last`, fields.last);
	const name = readOptionalString(reader, at, fields, "name");
	if (id === null || via === null || first === null || last === null || !name.ok) return null;
	return {
		id,
		via,
		first,
		last,
		...name.value === void 0 ? {} : { name: name.value }
	};
}
function readBranch(reader, at, value) {
	const fields = readObject(reader, at, value, [
		"id",
		"label",
		"body",
		"folds"
	]);
	if (fields === null) return null;
	const id = readId(reader, `${at}.id`, fields.id, "r");
	const label = readOptionalString(reader, at, fields, "label");
	const body = readSeq(reader, at, fields);
	if (id === null || !label.ok || body === null) return null;
	return {
		id,
		...label.value === void 0 ? {} : { label: label.value },
		body
	};
}
/** A branch of a parallel block: no label (UX PB1). */
function readParallelBranch(reader, at, value) {
	const fields = readObject(reader, at, value, [
		"id",
		"body",
		"folds"
	]);
	if (fields === null) return null;
	const id = readId(reader, `${at}.id`, fields.id, "r");
	const body = readSeq(reader, at, fields);
	if (id === null || body === null) return null;
	return {
		id,
		body
	};
}
function readArm(reader, at, value) {
	const fields = readObject(reader, at, value, [
		"id",
		"label",
		"body",
		"folds"
	]);
	if (fields === null) return null;
	const id = readId(reader, `${at}.id`, fields.id, "r");
	const label = readString(reader, `${at}.label`, fields.label);
	const body = readSeq(reader, at, fields);
	if (id === null || label === null || body === null) return null;
	return {
		id,
		label,
		body
	};
}
function readBlock(reader, at, value) {
	if (!isRecord(value)) return fail$1(reader, at, "is not an object");
	switch (value.kind) {
		case "process":
		case "exit": {
			const { kind } = value;
			const fields = readObject(reader, at, value, [
				"id",
				"kind",
				"text"
			]);
			const id = readId(reader, `${at}.id`, value.id, "b");
			const text = readString(reader, `${at}.text`, value.text);
			if (fields === null || id === null || text === null) return null;
			return {
				id,
				kind,
				text
			};
		}
		case "endless": {
			const fields = readObject(reader, at, value, [
				"id",
				"kind",
				"body",
				"folds"
			]);
			const id = readId(reader, `${at}.id`, value.id, "b");
			const body = readSeq(reader, at, value);
			if (fields === null || id === null || body === null) return null;
			return {
				id,
				kind: "endless",
				body
			};
		}
		case "parallel": {
			const fields = readObject(reader, at, value, [
				"id",
				"kind",
				"text",
				"branches"
			]);
			const id = readId(reader, `${at}.id`, value.id, "b");
			const text = readString(reader, `${at}.text`, value.text);
			const branches = readArray(reader, `${at}.branches`, value.branches, (item, itemAt) => readParallelBranch(reader, itemAt, item));
			if (fields === null || id === null || text === null || branches === null) return null;
			return {
				id,
				kind: "parallel",
				text,
				branches
			};
		}
		case "if": {
			const fields = readObject(reader, at, value, [
				"id",
				"kind",
				"text",
				"yes",
				"no"
			]);
			const id = readId(reader, `${at}.id`, value.id, "b");
			const text = readString(reader, `${at}.text`, value.text);
			const yes = readBranch(reader, `${at}.yes`, value.yes);
			const no = readBranch(reader, `${at}.no`, value.no);
			if (fields === null || id === null || text === null || yes === null || no === null) return null;
			return {
				id,
				kind: "if",
				text,
				yes,
				no
			};
		}
		case "case": {
			const fields = readObject(reader, at, value, [
				"id",
				"kind",
				"text",
				"arms",
				"otherwise"
			]);
			const id = readId(reader, `${at}.id`, value.id, "b");
			const text = readString(reader, `${at}.text`, value.text);
			const arms = readArray(reader, `${at}.arms`, value.arms, (item, itemAt) => readArm(reader, itemAt, item));
			const hasOtherwise = "otherwise" in value;
			const otherwise = hasOtherwise ? readBranch(reader, `${at}.otherwise`, value.otherwise) : null;
			if (fields === null || id === null || text === null || arms === null || hasOtherwise && otherwise === null) return null;
			return {
				id,
				kind: "case",
				text,
				arms,
				otherwise
			};
		}
		case "while":
		case "doWhile":
		case "for": {
			const { kind } = value;
			const fields = readObject(reader, at, value, [
				"id",
				"kind",
				"text",
				"body",
				"folds"
			]);
			const id = readId(reader, `${at}.id`, value.id, "b");
			const text = readString(reader, `${at}.text`, value.text);
			const body = readSeq(reader, at, value);
			if (fields === null || id === null || text === null || body === null) return null;
			return {
				id,
				kind,
				text,
				body
			};
		}
		case "call": {
			const fields = readObject(reader, at, value, [
				"id",
				"kind",
				"target",
				"args",
				"result",
				"siteFolds"
			]);
			const id = readId(reader, `${at}.id`, value.id, "b");
			const target = readTarget(reader, `${at}.target`, value.target);
			const args = readString(reader, `${at}.args`, value.args);
			const result = readString(reader, `${at}.result`, value.result);
			const siteFolds = readOptionalArray(reader, at, value, "siteFolds", (item, itemAt) => readSiteFold(reader, itemAt, item));
			if (fields === null || id === null || target === null || args === null || result === null || siteFolds === null) return null;
			return {
				id,
				kind: "call",
				target,
				args,
				result,
				siteFolds
			};
		}
		default: return fail$1(reader, `${at}.kind`, "is not a known block kind");
	}
}
function readTarget(reader, at, value) {
	if (!isRecord(value)) return fail$1(reader, at, "is not an object");
	switch (value.kind) {
		case "local": {
			const fields = readObject(reader, at, value, ["kind", "diagram"]);
			const diagram = readId(reader, `${at}.diagram`, value.diagram, "d");
			return fields === null || diagram === null ? null : {
				kind: "local",
				diagram
			};
		}
		case "named": {
			const fields = readObject(reader, at, value, ["kind", "name"]);
			const name = readString(reader, `${at}.name`, value.name);
			return fields === null || name === null ? null : {
				kind: "named",
				name
			};
		}
		case "external": {
			const fields = readObject(reader, at, value, [
				"kind",
				"file",
				"diagram",
				"lastName"
			]);
			const file = readString(reader, `${at}.file`, value.file);
			const diagram = readId(reader, `${at}.diagram`, value.diagram, "d");
			const lastName = readString(reader, `${at}.lastName`, value.lastName);
			if (fields === null || file === null || diagram === null || lastName === null) return null;
			return {
				kind: "named",
				name: lastName
			};
		}
		case "lost": {
			const fields = readObject(reader, at, value, [
				"kind",
				"lastName",
				"file"
			]);
			const lastName = readString(reader, `${at}.lastName`, value.lastName);
			const file = readOptionalString(reader, at, value, "file");
			if (fields === null || lastName === null || !file.ok) return null;
			return {
				kind: "named",
				name: lastName
			};
		}
		default: return fail$1(reader, `${at}.kind`, "is not a known call target kind");
	}
}
/** Reads the view state. Ids may dangle (weak references, 01-model 2); only the form is checked. */
function readView(reader, value) {
	const fields = readObject(reader, "view", value, [
		"folded",
		"opened",
		"bands",
		"resultSymbol"
	]);
	if (fields === null) return null;
	const folded = readArray(reader, "view.folded", fields.folded, (item, at) => readString(reader, at, item));
	const opened = readArray(reader, "view.opened", fields.opened, (item, at) => readArray(reader, at, item, (id, idAt) => readBlockRef(reader, idAt, id)));
	const { bands } = fields;
	const resultSymbol = resultSymbols.find((symbol) => symbol === fields.resultSymbol);
	if (typeof bands !== "boolean") return fail$1(reader, "view.bands", "is not true or false");
	if (resultSymbol === void 0) return fail$1(reader, "view.resultSymbol", "is not \"←\" or \"=\"");
	if (folded === null || opened === null) return null;
	return {
		folded,
		opened,
		bands,
		resultSymbol
	};
}
// ../../packages/core/src/format/base64.ts
var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
/** Encodes bytes as base64 with `=` padding and no line breaks. */
function encodeBase64(bytes) {
	const parts = [];
	const letter = (index) => alphabet.charAt(index & 63);
	for (let at = 0; at < bytes.length; at += 3) {
		const first = bytes[at] ?? 0;
		const second = bytes[at + 1] ?? 0;
		const third = bytes[at + 2] ?? 0;
		const remaining = bytes.length - at;
		parts.push(letter(first >> 2), letter(first << 4 | second >> 4), remaining > 1 ? letter(second << 2 | third >> 6) : "=", remaining > 2 ? letter(third) : "=");
	}
	return parts.join("");
}
// ../../packages/core/src/format/model-element.ts
/** The SVG namespace of the root element. */
var svgNamespace = "http://www.w3.org/2000/svg";
/** The namespace of the model element (ADR-0035). A name, not an address. */
var modelNamespace = "https://github.com/reddiana/AriadneNSD";
var namePattern = /[A-Za-z_][\w.:-]*/y;
var attributePattern = /\s+([^\s=/>]+)\s*=\s*("[^"]*"|'[^']*')/y;
var tagEndPattern = /\s*(\/?)>/y;
var endTagPattern = /<\/([A-Za-z_][\w.:-]*)\s*>/y;
/**
* Finds the model element (`ans:document`) inside `<metadata>` and returns its text.
* Text and CDATA sections inside it are joined into one text, as an XML parser does (3.2).
* A prototype file (`<metadata id="ariadne-nsd-model">`, ADR-0035) is told apart from a file
* with no model, though both cannot be edited.
*/
function findModelElement(svg) {
	const stack = [];
	const found = [];
	let modelVersion = null;
	let modelSha256 = null;
	let metadataStart = -1;
	let modelText = null;
	let isRootSeen = false;
	let isPrototypeSeen = false;
	const damaged = (detail) => isRootSeen ? {
		ok: false,
		reason: "damaged",
		detail
	} : {
		ok: false,
		reason: "noModel",
		detail: `not an SVG file: ${detail}`
	};
	let at = svg.charCodeAt(0) === 65279 ? 1 : 0;
	const modelElement = (text, end) => ({
		version: modelVersion,
		text,
		drawingSha256: modelSha256,
		metadata: {
			start: metadataStart,
			end
		}
	});
	const addText = (raw) => {
		if (modelText !== null) {
			const decoded = decodeText(raw);
			if (decoded === null) return "the model element has a broken character reference";
			modelText.push(decoded);
		} else if (stack.length === 0 && raw.trim() !== "") return "text outside the root element";
		return null;
	};
	while (at < svg.length) {
		const open = svg.indexOf("<", at);
		const problem = addText(svg.slice(at, open === -1 ? svg.length : open));
		if (problem !== null) return damaged(problem);
		if (open === -1) break;
		if (svg.startsWith("<!--", open)) {
			const close = svg.indexOf("-->", open + 4);
			if (close === -1) return damaged("a comment is not closed");
			at = close + 3;
		} else if (svg.startsWith("<![CDATA[", open)) {
			const close = svg.indexOf("]]>", open + 9);
			if (close === -1) return damaged("a CDATA section is not closed");
			if (stack.length === 0) return damaged("CDATA outside the root element");
			modelText?.push(svg.slice(open + 9, close));
			at = close + 3;
		} else if (svg.startsWith("<?", open)) {
			const close = svg.indexOf("?>", open + 2);
			if (close === -1) return damaged("a processing instruction is not closed");
			at = close + 2;
		} else if (svg.startsWith("<!", open)) {
			const close = declarationEnd(svg, open + 2);
			if (close === -1) return damaged("a declaration is not closed");
			at = close + 1;
		} else if (svg.startsWith("</", open)) {
			endTagPattern.lastIndex = open;
			const match = endTagPattern.exec(svg);
			const top = stack.pop();
			if (match === null || top === void 0 || match[1] !== top.name) return damaged(`an end tag does not match at ${String(open)}`);
			at = endTagPattern.lastIndex;
			if (top.isModel && modelText !== null) {
				found.push(modelElement(modelText.join(""), at));
				modelText = null;
			}
			if (top.isMetadata && top.start === metadataStart) {
				const last = found.at(-1);
				if (last !== void 0) found[found.length - 1] = {
					...last,
					metadata: {
						start: metadataStart,
						end: at
					}
				};
			}
		} else {
			const tag = readStartTag(svg, open);
			if (tag === null) return damaged(`a start tag is broken at ${String(open)}`);
			at = tag.end;
			if (modelText !== null) return damaged("the model element has a child element");
			if (stack.length === 0) {
				if (isRootSeen) return damaged("more than one root element");
				isRootSeen = true;
			}
			const parent = stack.at(-1);
			const namespaces = new Map(parent?.namespaces ?? []);
			for (const [key, value] of tag.attributes) if (key === "xmlns") namespaces.set("", value);
			else if (key.startsWith("xmlns:")) namespaces.set(key.slice(6), value);
			const { prefix, local } = splitName(tag.name);
			const namespace = namespaces.get(prefix);
			if (parent === void 0 && (local !== "svg" || namespace !== "http://www.w3.org/2000/svg")) return {
				ok: false,
				reason: "noModel",
				detail: "the root element is not an SVG <svg>"
			};
			const isMetadata = local === "metadata" && namespace === "http://www.w3.org/2000/svg";
			if (isMetadata && tag.attributes.get("id") === "ariadne-nsd-model") isPrototypeSeen = true;
			const isModel = local === "document" && namespace === "https://github.com/reddiana/AriadneNSD" && parent?.isMetadata === true;
			if (isModel) {
				modelVersion = tag.attributes.get("version") ?? null;
				modelSha256 = tag.attributes.get("drawing-sha256") ?? null;
				metadataStart = parent.start;
				modelText = [];
			}
			if (tag.isEmpty) {
				if (isModel) {
					found.push(modelElement("", tag.end));
					modelText = null;
				}
			} else stack.push({
				name: tag.name,
				namespaces,
				isMetadata,
				isModel,
				start: open
			});
		}
	}
	if (!isRootSeen) return {
		ok: false,
		reason: "noModel",
		detail: "no root element"
	};
	if (stack.length > 0) return damaged("elements are not closed");
	const [element, ...others] = found;
	if (element === void 0) return isPrototypeSeen ? {
		ok: false,
		reason: "prototype",
		detail: "a prototype file (ADR-0035)"
	} : {
		ok: false,
		reason: "noModel",
		detail: "no model element in <metadata>"
	};
	if (others.length > 0) return damaged("more than one model element");
	return {
		ok: true,
		element
	};
}
function readStartTag(svg, open) {
	namePattern.lastIndex = open + 1;
	const name = namePattern.exec(svg)?.[0];
	if (name === void 0) return null;
	let at = namePattern.lastIndex;
	const attributes = /* @__PURE__ */ new Map();
	for (;;) {
		attributePattern.lastIndex = at;
		const match = attributePattern.exec(svg);
		if (match === null) break;
		const [, key = "", quoted = ""] = match;
		const value = decodeText(quoted.slice(1, -1));
		if (value === null || attributes.has(key)) return null;
		attributes.set(key, value);
		at = attributePattern.lastIndex;
	}
	tagEndPattern.lastIndex = at;
	const end = tagEndPattern.exec(svg);
	if (end === null) return null;
	return {
		name,
		attributes,
		isEmpty: end[1] === "/",
		end: tagEndPattern.lastIndex
	};
}
function splitName(name) {
	const colon = name.indexOf(":");
	return colon === -1 ? {
		prefix: "",
		local: name
	} : {
		prefix: name.slice(0, colon),
		local: name.slice(colon + 1)
	};
}
/** Finds the `>` that ends a `<!…>` declaration, skipping a `[…]` internal subset. */
function declarationEnd(svg, from) {
	let depth = 0;
	for (let at = from; at < svg.length; at += 1) {
		const character = svg[at];
		if (character === "[") depth += 1;
		else if (character === "]") depth -= 1;
		else if (character === ">" && depth <= 0) return at;
	}
	return -1;
}
var predefinedEntities = /* @__PURE__ */ new Map([
	["lt", "<"],
	["gt", ">"],
	["amp", "&"],
	["quot", "\""],
	["apos", "'"]
]);
/** Decodes the five predefined entities and character references, or `null` if one is broken. */
function decodeText(raw) {
	if (!raw.includes("&")) return raw;
	const broken = [];
	const decoded = raw.replace(/&([^;&\s]*);?/g, (whole, name) => {
		if (!whole.endsWith(";")) {
			broken.push(whole);
			return whole;
		}
		const code = name.startsWith("#x") ? Number.parseInt(name.slice(2), 16) : name.startsWith("#") ? Number.parseInt(name.slice(1), 10) : NaN;
		if (!Number.isNaN(code)) {
			if (code > 1114111 || !/^#(x[0-9a-fA-F]+|\d+)$/.test(name)) {
				broken.push(whole);
				return whole;
			}
			return String.fromCodePoint(code);
		}
		const entity = predefinedEntities.get(name);
		if (entity === void 0) {
			broken.push(whole);
			return whole;
		}
		return entity;
	});
	return broken.length > 0 ? null : decoded;
}
// ../../packages/core/src/format/sha256.ts
var roundConstants = [
	1116352408,
	1899447441,
	3049323471,
	3921009573,
	961987163,
	1508970993,
	2453635748,
	2870763221,
	3624381080,
	310598401,
	607225278,
	1426881987,
	1925078388,
	2162078206,
	2614888103,
	3248222580,
	3835390401,
	4022224774,
	264347078,
	604807628,
	770255983,
	1249150122,
	1555081692,
	1996064986,
	2554220882,
	2821834349,
	2952996808,
	3210313671,
	3336571891,
	3584528711,
	113926993,
	338241895,
	666307205,
	773529912,
	1294757372,
	1396182291,
	1695183700,
	1986661051,
	2177026350,
	2456956037,
	2730485921,
	2820302411,
	3259730800,
	3345764771,
	3516065817,
	3600352804,
	4094571909,
	275423344,
	430227734,
	506948616,
	659060556,
	883997877,
	958139571,
	1322822218,
	1537002063,
	1747873779,
	1955562222,
	2024104815,
	2227730452,
	2361852424,
	2428436474,
	2756734187,
	3204031479,
	3329325298
];
/** The UTF-8 bytes of a text. Lone surrogates become U+FFFD, as `TextEncoder` does. */
function utf8Bytes(text) {
	const bytes = [];
	for (const character of text) {
		let code = character.codePointAt(0) ?? 0;
		if (code >= 55296 && code <= 57343) code = 65533;
		if (code < 128) bytes.push(code);
		else if (code < 2048) bytes.push(192 | code >> 6, 128 | code & 63);
		else if (code < 65536) bytes.push(224 | code >> 12, 128 | code >> 6 & 63, 128 | code & 63);
		else bytes.push(240 | code >> 18, 128 | code >> 12 & 63, 128 | code >> 6 & 63, 128 | code & 63);
	}
	return Uint8Array.from(bytes);
}
/** The SHA-256 of a text's UTF-8 bytes, as 64 lowercase hex digits. */
function sha256Hex(text) {
	const message = utf8Bytes(text);
	const length = message.length;
	const padded = new Uint8Array(((length + 8 >> 6) + 1) * 64);
	padded.set(message);
	padded[length] = 128;
	const view = new DataView(padded.buffer);
	view.setUint32(padded.length - 8, Math.floor(length / 536870912));
	view.setUint32(padded.length - 4, length * 8 >>> 0);
	const hash = [
		1779033703,
		3144134277,
		1013904242,
		2773480762,
		1359893119,
		2600822924,
		528734635,
		1541459225
	];
	const words = new Array(64).fill(0);
	const rotate = (value, by) => value >>> by | value << 32 - by;
	for (let block = 0; block < padded.length; block += 64) {
		for (let index = 0; index < 16; index += 1) words[index] = view.getUint32(block + index * 4);
		for (let index = 16; index < 64; index += 1) {
			const w15 = words[index - 15] ?? 0;
			const w2 = words[index - 2] ?? 0;
			const s0 = rotate(w15, 7) ^ rotate(w15, 18) ^ w15 >>> 3;
			const s1 = rotate(w2, 17) ^ rotate(w2, 19) ^ w2 >>> 10;
			words[index] = (words[index - 16] ?? 0) + s0 + (words[index - 7] ?? 0) + s1 | 0;
		}
		let [a, b, c, d, e, f, g, h] = hash;
		for (let index = 0; index < 64; index += 1) {
			const s1 = rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25);
			const choose = e & f ^ ~e & g;
			const t1 = h + s1 + choose + (roundConstants[index] ?? 0) + (words[index] ?? 0) | 0;
			const t2 = (rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) + (a & b ^ a & c ^ b & c) | 0;
			h = g;
			g = f;
			f = e;
			e = d + t1 | 0;
			d = c;
			c = b;
			b = a;
			a = t1 + t2 | 0;
		}
		[
			a,
			b,
			c,
			d,
			e,
			f,
			g,
			h
		].forEach((value, index) => {
			hash[index] = (hash[index] ?? 0) + value | 0;
		});
	}
	return hash.map((value) => (value >>> 0).toString(16).padStart(8, "0")).join("");
}
// ../../packages/core/src/format/svg-file.ts
/**
* Assembles the saved SVG file (01-file-format 2): the model in `<metadata>`, the subset fonts in
* `<style>`, the paper and the drawing. The same parts always give the same text (R-FMT-03).
* The model element carries the fingerprint of everything else (the drawing part): the SHA-256
* of the file without its `<metadata>` element, which is the pure SVG (R-FMT-09, R-EXP-02).
*/
function assembleSvgFile(parts) {
	const fingerprint = sha256Hex(assembleImageSvg(parts.drawing, parts.fonts));
	return assemble(parts.drawing, parts.fonts, [
		"  <metadata>",
		`    <ans:document xmlns:ans="${modelNamespace}" version="${String(1)}" drawing-sha256="${fingerprint}"><![CDATA[`,
		escapeCdata(serializeModelJson(parts.doc, parts.kept)),
		"    ]]></ans:document>",
		"  </metadata>"
	]);
}
/**
* A picture of a drawing, without the model: the same SVG as a saved file but no `<metadata>`.
* The pure SVG of "Export ▸ SVG" (R-EXP-02) and the examples' thumbnails. It does not open as a
* document.
*/
function assembleImageSvg(drawing, fonts) {
	return assemble(drawing, fonts, []);
}
function assemble(drawing, fonts, metadata) {
	if (!drawing.content.startsWith("<g class=\"ans-render\"")) throw new Error("The drawing must be one <g class=\"ans-render\"> element (01-file-format 2)");
	return [
		`<svg xmlns="${svgNamespace}" version="1.1" width="${size(drawing.width)}" height="${size(drawing.height)}" viewBox="${escapeAttribute(drawing.viewBox)}">`,
		...metadata,
		"  <style>",
		...fonts.map(fontFace),
		"  </style>",
		`  <rect width="100%" height="100%" fill="${escapeAttribute(drawing.paper)}"/>`,
		`  ${drawing.content}`,
		"</svg>",
		""
	].join("\n");
}
/**
* Opens a saved file (`.ns` or `.ns.svg`): finds the model element, checks that its `version`
* attribute matches the JSON, migrates and checks the model (01-file-format 5).
* The drawing is ignored (R-FMT-05) and never read back into a model (R-FMT-06).
* `options` as for `parseModel`: the check, and the drawing language of a file without one.
*/
function openSvgFile(text, options = {}) {
	const found = findModelElement(text);
	if (!found.ok) return openFailure(found.reason, found.detail);
	let value;
	try {
		value = JSON.parse(found.element.text);
	} catch (error) {
		return openFailure("damaged", `model JSON does not parse: ${String(error)}`);
	}
	const jsonVersion = typeof value === "object" && value !== null && "version" in value ? value.version : void 0;
	if (typeof jsonVersion !== "number" || found.element.version !== String(jsonVersion)) return openFailure("damaged", "the version attribute and the JSON version differ");
	return parseModel(value, options);
}
/**
* Makes JSON text safe inside CDATA. `]]>` splits the section (01-file-format 3.2).
* U+FFFE and U+FFFF are not allowed in XML; they can only be in JSON strings, so they are
* written as JSON escapes, which read back as the same string.
*/
function escapeCdata(json) {
	return json.replaceAll("]]>", "]]]]><![CDATA[>").replaceAll("￾", "\\ufffe").replaceAll("￿", "\\uffff");
}
function fontFace(font) {
	if (/["\\<>&]/.test(font.family)) throw new Error(`A font family name cannot contain quotes or markup: ${font.family}`);
	return `    @font-face { font-family: "${font.family}"; src: url(data:font/woff;base64,${encodeBase64(font.woff)}); }`;
}
function size(value) {
	if (!Number.isFinite(value) || value < 0) throw new Error(`A drawing size must be a finite number of 0 or more: ${String(value)}`);
	return String(value);
}
function escapeAttribute(value) {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");
}
// ../../apps/web/src/files/share-link.ts
/** What a share link fragment starts with: the format name and its version. */
var shareLinkPrefix = "ns1.";
/** Links longer than this are copied with a warning: some apps cut long links (UX SH2). */
var longShareLinkLength = 8192;
/** The most bytes a link may unpack to (the zip bomb guard). Far above any real document. */
var maxUnpackedBytes = 16777216;
/** Deflate-raw with the browser's CompressionStream, or `null` where there is none. */
function browserDeflate() {
	if (typeof CompressionStream === "undefined" || typeof DecompressionStream === "undefined") return null;
	return {
		compress: async (bytes) => {
			const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
			return new Uint8Array(await new Response(stream).arrayBuffer());
		},
		decompress: async (bytes, limit) => {
			return readAtMost(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw")), limit);
		}
	};
}
/** Reads a byte stream to its end, or stops and returns `null` once it passes `limit` bytes. */
async function readAtMost(stream, limit) {
	const reader = stream.getReader();
	const chunks = [];
	let total = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		total += value.length;
		if (total > limit) {
			await reader.cancel();
			return null;
		}
		chunks.push(value);
	}
	const bytes = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.length;
	}
	return bytes;
}
/**
* Makes the fragment (without `#`) of a share link for a document: its model JSON (the editor's
* snapshot) and its name. Packed with deflate-raw when the browser can, otherwise as it is.
*/
async function writeShareLink(modelJson, name, deflate) {
	const json = JSON.stringify({
		name,
		model: JSON.parse(modelJson)
	});
	const bytes = new TextEncoder().encode(json);
	if (deflate === null) return `${shareLinkPrefix}j.${toBase64Url(bytes)}`;
	return `${shareLinkPrefix}d.${toBase64Url(await deflate.compress(bytes))}`;
}
/** Whether a fragment (without `#`) is meant as a share link of some version: `ns` + a number. */
function isShareLink(fragment) {
	return /^ns\d+\./.test(fragment);
}
/**
* Reads a share link's fragment (without `#`). Checks the length first, unpacks with the size
* cap, then reads the JSON envelope. The model inside is not checked here: the caller passes it
* to the file format's parser, as for a file.
*/
async function readShareLink(fragment, deflate) {
	if (!isShareLink(fragment)) return failure("notShareLink", "the fragment is not a share link");
	if (!fragment.startsWith("ns1.")) return failure("newerVersion", `unknown link version ${fragment.slice(0, fragment.indexOf("."))}`);
	if (fragment.length > 1048576) return failure("tooLarge", `the link is ${String(fragment.length)} characters long`);
	const rest = fragment.slice(4);
	const packing = rest.slice(0, 2);
	if (packing === "u.") {
		let text;
		try {
			text = decodeURIComponent(rest.slice(2));
		} catch (error) {
			return failure("damaged", `the link is not percent-encoded: ${String(error)}`);
		}
		return readEnvelopeText(text);
	}
	if (packing !== "d." && packing !== "j.") return failure("damaged", `unknown packing "${rest.slice(0, 1)}"`);
	const packed = fromBase64Url(rest.slice(2));
	if (packed === null) return failure("damaged", "the link is not base64url");
	let bytes = packed;
	if (packing === "d.") {
		if (deflate === null) return failure("unsupported", "this browser has no DecompressionStream");
		try {
			bytes = await deflate.decompress(packed, maxUnpackedBytes);
		} catch (error) {
			return failure("damaged", `the link does not unpack: ${String(error)}`);
		}
	}
	if (bytes === null) return failure("tooLarge", `the link unpacks to more than ${String(maxUnpackedBytes)} bytes`);
	return readEnvelope(bytes);
}
function readEnvelope(bytes) {
	let text;
	try {
		text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch (error) {
		return failure("damaged", `the link is not UTF-8: ${String(error)}`);
	}
	return readEnvelopeText(text);
}
function readEnvelopeText(text) {
	let value;
	try {
		value = JSON.parse(text);
	} catch (error) {
		return failure("damaged", `the link's JSON does not read: ${String(error)}${bracketHint(text)}`);
	}
	if (typeof value !== "object" || value === null || Array.isArray(value)) return failure("damaged", "the link does not hold an object");
	const keys = Object.keys(value).sort().join(",");
	if (keys !== "model,name" || !("name" in value) || !("model" in value)) return failure("damaged", `the link holds the keys ${keys}`);
	const { name, model } = value;
	if (typeof name !== "string") return failure("damaged", "the name is not a string");
	return {
		ok: true,
		name,
		model
	};
}
/**
* For JSON that does not parse: how its brackets are out of balance (outside strings), or `''`.
* A missing or extra closing bracket is the usual slip in a link written by hand (UX LG6), and
* the parser's position alone does not say which bracket.
*/
function bracketHint(text) {
	const counts = /* @__PURE__ */ new Map();
	let isInString = false;
	let isEscaped = false;
	for (const character of text) if (isInString) {
		if (isEscaped) isEscaped = false;
		else if (character === "\\") isEscaped = true;
		else if (character === "\"") isInString = false;
	} else if (character === "\"") isInString = true;
	else if ("{}[]".includes(character)) counts.set(character, (counts.get(character) ?? 0) + 1);
	const unbalanced = [];
	for (const [open, close] of [["{", "}"], ["[", "]"]]) {
		const opened = counts.get(open) ?? 0;
		const closed = counts.get(close) ?? 0;
		if (opened !== closed) unbalanced.push(`${String(opened)} "${open}" but ${String(closed)} "${close}"`);
	}
	return unbalanced.length === 0 ? "" : `; it has ${unbalanced.join(" and ")}`;
}
function failure(reason, detail) {
	return {
		ok: false,
		reason,
		detail
	};
}
/** The share link: this page's address (without query) with the fragment. */
function shareLinkUrl(page, fragment) {
	return `${page.origin}${page.pathname}#${fragment}`;
}
/** Bytes as base64url without padding (RFC 4648 5): the URL-safe letters only. */
function toBase64Url(bytes) {
	let binary = "";
	for (let start = 0; start < bytes.length; start += 32768) binary += String.fromCharCode(...bytes.subarray(start, start + 32768));
	return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
/** base64url (with or without padding) back to bytes, or `null` if it has other characters. */
function fromBase64Url(text) {
	if (!/^[A-Za-z0-9_-]*={0,2}$/.test(text) || text.replace(/=+$/, "").length % 4 === 1) return null;
	const binary = atob(text.replace(/=+$/, "").replaceAll("-", "+").replaceAll("_", "/"));
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
	return bytes;
}
// src/engine.ts
/** The page the links open: the site's root, as in /llms.txt. */
var defaultBase = "https://ariadnensd.com/";
/**
* Reads any input the skill is given: a share link (the whole URL or the part after `#`), a saved
* file (`.ns.svg`, `.ns`), a share link's envelope `{"name", "model"}`, or model JSON.
* `fileName` is the name of the file it was read from, if any: a saved file is named by it.
*/
async function readSource(text, fileName = null) {
	const trimmed = (text.charCodeAt(0) === 65279 ? text.slice(1) : text).trim();
	const fragment = linkFragment(trimmed);
	if (fragment !== null) {
		const read = await readShareLink(fragment, browserDeflate());
		if (!read.ok) return {
			ok: false,
			reason: "link",
			detail: `${read.reason}: ${read.detail}`
		};
		return opened(parseModel(read.model), read.name);
	}
	if (trimmed.startsWith("<")) return opened(openSvgFile(trimmed), fileName === null ? null : savedName(fileName));
	let value;
	try {
		value = JSON.parse(trimmed);
	} catch (error) {
		return {
			ok: false,
			reason: "notModel",
			detail: `the JSON does not parse: ${String(error)}${bracketHint(trimmed)}`
		};
	}
	if (isEnvelope(value)) {
		if (typeof value.name !== "string") return {
			ok: false,
			reason: "notModel",
			detail: "the envelope’s \"name\" is not a string"
		};
		return opened(parseModel(value.model), value.name);
	}
	return opened(parseModel(value), null);
}
/** The part after `#` of a share link, or `null` when the text is no link. */
function linkFragment(text) {
	if (/\s/.test(text)) return null;
	const hash = text.indexOf("#");
	const fragment = hash >= 0 ? text.slice(hash + 1) : text;
	return isShareLink(fragment) ? fragment : null;
}
function isEnvelope(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).sort().join(",") === "model,name";
}
function opened(result, name) {
	return result.ok ? {
		ok: true,
		loaded: result.value,
		name
	} : {
		ok: false,
		reason: result.reason,
		detail: result.detail
	};
}
/** A file path's last part: the name a saved file is known by. */
function savedName(path) {
	return path.split(/[\\/]/).at(-1) ?? path;
}
/**
* The document's file name when nothing names it: the first header's name (a Method's name
* without its parameters), else `diagram`, with `.ns.svg`.
*/
function defaultName(content) {
	const head = content.diagrams.find((diagram) => diagram.head !== null)?.head ?? null;
	const name = head === null ? "" : headName(head).replace(/[\\/:*?"<>|]/g, "").trim();
	return `${name === "" ? "diagram" : name}.ns.svg`;
}
/** The model JSON as the app writes it (2-space indent, keys in the spec's order). */
function modelText(loaded) {
	return serializeModelJson(loaded.doc, loaded.kept);
}
/** How many diagrams and blocks a document has, and the next free id of each kind. */
function summary(content) {
	let blocks = 0;
	for (const id of contentIds(content)) if (id.startsWith("b")) blocks += 1;
	const ids = createIdGenerator(content);
	return {
		diagrams: content.diagrams.length,
		blocks,
		nextIds: {
			diagram: ids.next("diagram"),
			block: ids.next("block"),
			branch: ids.next("branch"),
			fold: ids.next("fold")
		}
	};
}
/**
* The share link of a document, made as File › Copy Share Link makes it (06-web 3): the app's
* model JSON and the name in an envelope, deflate-raw, base64url, after `#ns1.d.`.
* Links longer than the app opens are not made.
*/
async function makeLink(loaded, name, base = defaultBase) {
	const fragment = await writeShareLink(modelText(loaded), name, browserDeflate());
	const page = new URL(base);
	const url = shareLinkUrl({
		origin: page.origin,
		pathname: page.pathname
	}, fragment);
	if (fragment.length > 1048576) return {
		ok: false,
		length: url.length
	};
	return {
		ok: true,
		url,
		isLong: url.length > longShareLinkLength
	};
}
/**
* The saved file (`.ns.svg`) of a document, as File › Save writes it (03-editor 6): the drawing,
* the model, and the block font's subset (or the text as outlines, R-FMT-10). The same steps as
* the editor's `serializeDocument`; the same document always gives the same text (R-FMT-03).
*/
function saveFile(loaded, fonts) {
	const { doc, kept } = loaded;
	const isOutlined = doc.content.settings.textOutlines === true;
	const drawn = savedDrawing(renderDoc(doc), isOutlined ? readGlyphOutlines(fonts.ttf) : null);
	return assembleSvgFile({
		doc,
		kept,
		drawing: drawn.svg,
		fonts: isOutlined && drawn.codePoints.length === 0 ? [] : [{
			family: blockFont.familyName,
			woff: fonts.subsetter.subsetToWoff(fonts.ttf, drawn.codePoints)
		}]
	});
}
// src/cli.ts
var usage = `nsd.mjs — AriadneNSD's engine for the ariadne-nsd skill (no network needed)

Usage: node nsd.mjs <command> [input] [options]

input is a file path, "-" for stdin (the default), or a share link
(https://ariadnensd.com/#ns1.… or just ns1.…). A file may hold model JSON, an
envelope {"name": "x.ns.svg", "model": {…}}, or a saved .ns.svg / .ns file.

Commands:
  check [input]            Validate with the app's own parser. Prints the size and
                           the next free ids (d, b, r, f) for adding blocks.
  link [input]             Print the share link the app makes (File › Copy Share Link).
  save [input] [-o file]   Write the saved file (.ns.svg) the app writes (File › Save).
                           Without -o: the envelope's or --name's name, else the
                           first Method's name + .ns.svg.
  read [input]             Print the model JSON (as the app writes it).
                           --envelope prints {"name", "model"} instead.

Options:
  -o, --out <file>   Where save writes.
  --name <name>      The document name in the link (default: the envelope's, the
                     file's, or the first Method's name + .ns.svg).
  --base <url>       The page links open (default ${defaultBase}).
  --json             Print the result as one JSON object (errors too).
  -h, --help         This text.

Exit codes: 0 ok, 1 the input is not a valid document (fix it and run again), 2 usage.`;
var UsageError = class extends Error {};
function parseArgs(args) {
	const positional = [];
	let out = null;
	let name = null;
	let base = defaultBase;
	let isJson = false;
	let isEnvelope = false;
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index] ?? "";
		const value = () => {
			const next = args[index + 1];
			if (next === void 0) throw new UsageError(`${arg} needs a value`);
			index += 1;
			return next;
		};
		switch (arg) {
			case "-h":
			case "--help": return "help";
			case "-o":
			case "--out":
				out = value();
				break;
			case "--name":
				name = value();
				break;
			case "--base":
				base = value();
				break;
			case "--json":
				isJson = true;
				break;
			case "--envelope":
				isEnvelope = true;
				break;
			default:
				if (arg.startsWith("--")) throw new UsageError(`unknown option ${arg}`);
				positional.push(arg);
		}
	}
	const [command, input = "-", ...rest] = positional;
	if (command === void 0 || command === "help") return "help";
	if (rest.length > 0) throw new UsageError(`one input only, got also: ${rest.join(" ")}`);
	return {
		command,
		input,
		out,
		name,
		base,
		isJson,
		isEnvelope
	};
}
/** What to do about each kind of failure: the next step for whoever reads the message. */
var hints = {
	damaged: "The model breaks a rule of the format. Fix what the detail names (it gives the path, e.g. diagrams[0].body[2]) and run check again.",
	notModel: "The input is not JSON. Fix the JSON (the detail says where, and how the brackets are off) and run check again.",
	noModel: "This SVG holds no AriadneNSD model: it is a picture (for example File › Export › SVG), not a saved document.",
	prototype: "This file was written by the prototype (format version 0) and cannot be opened.",
	newerVersion: "This was written by a newer AriadneNSD; this script cannot read it.",
	link: "The share link does not read: it may be cut off or changed. Ask for the whole link, or for the saved file."
};
/** Runs one command line. Returns the exit code. */
async function run(args, io) {
	let options;
	try {
		options = parseArgs(args);
	} catch (error) {
		if (error instanceof UsageError) {
			io.err(`Usage error: ${error.message}\n\n${usage}\n`);
			return 2;
		}
		throw error;
	}
	if (options === "help") {
		io.out(`${usage}\n`);
		return 0;
	}
	const { command } = options;
	if (![
		"check",
		"link",
		"save",
		"read"
	].includes(command)) {
		io.err(`Usage error: unknown command "${command}"\n\n${usage}\n`);
		return 2;
	}
	const isLink = /^(https?:\/\/[^\s]*#)?ns\d+\./.test(options.input);
	const fileName = options.input === "-" || isLink ? null : options.input;
	let text;
	try {
		text = fileName === null ? isLink ? options.input : await io.readStdin() : await io.readFile(fileName);
	} catch (error) {
		return fail(io, options, "input", `cannot read ${options.input}: ${String(error)}`);
	}
	const source = await readSource(text, fileName);
	if (!source.ok) return fail(io, options, source.reason, source.detail);
	const { loaded } = source;
	const name = options.name ?? source.name ?? defaultName(loaded.doc.content);
	switch (command) {
		case "check": {
			const facts = summary(loaded.doc.content);
			if (options.isJson) io.out(`${JSON.stringify({
				ok: true,
				name,
				...facts
			})}\n`);
			else {
				const next = Object.values(facts.nextIds).join(" ");
				io.out(`OK: ${String(facts.diagrams)} diagram(s), ${String(facts.blocks)} block(s). Next free ids: ${next}\n`);
			}
			return 0;
		}
		case "link": {
			const made = await makeLink(loaded, name, options.base);
			if (!made.ok) return fail(io, options, "tooLong", `the link would be ${String(made.length)} characters, longer than the app opens. Give the user the saved file instead (save).`);
			if (options.isJson) io.out(`${JSON.stringify({
				ok: true,
				name,
				url: made.url,
				length: made.url.length
			})}\n`);
			else {
				io.out(`${made.url}\n`);
				if (made.isLong) io.err(`Note: the link is ${String(made.url.length)} characters long; some apps cut long links. Give the saved file too.\n`);
			}
			return 0;
		}
		case "save": {
			const path = options.out ?? name;
			const text = saveFile(loaded, await io.fonts());
			await io.writeFile(path, text);
			const bytes = new TextEncoder().encode(text).length;
			if (options.isJson) io.out(`${JSON.stringify({
				ok: true,
				path,
				bytes
			})}\n`);
			else io.out(`Saved ${path} (${String(bytes)} bytes)\n`);
			return 0;
		}
		default: {
			const model = modelText(loaded);
			if (options.isEnvelope || options.isJson) {
				const envelope = {
					name,
					model: JSON.parse(model)
				};
				io.out(`${JSON.stringify(envelope, null, options.isJson ? void 0 : 2)}\n`);
			} else io.out(`${model}\n`);
			return 0;
		}
	}
}
function fail(io, options, reason, detail) {
	const hint = hints[reason] ?? "";
	if (options.isJson) io.out(`${JSON.stringify({
		ok: false,
		reason,
		detail,
		hint
	})}\n`);
	else io.err(`Error (${reason}): ${detail}\n${hint === "" ? "" : `${hint}\n`}`);
	return 1;
}
// src/node-io.ts
/** Node's files and streams, with the fonts from `loadFonts` (loaded once, when save needs them). */
function nodeIo(loadFonts) {
	let fonts = null;
	return {
		readFile: async (path) => readFile(path, "utf8"),
		readStdin: async () => {
			const chunks = [];
			for await (const chunk of process.stdin) chunks.push(chunk);
			return Buffer.concat(chunks).toString("utf8");
		},
		writeFile: async (path, text) => writeFile(path, text, "utf8"),
		out: (text) => process.stdout.write(text),
		err: (text) => process.stderr.write(text),
		fonts: async () => fonts ??= loadFonts()
	};
}
// src/main.ts
var unpack = (base64) => new Uint8Array(brotliDecompressSync(Buffer.from(base64, "base64")));
var io = nodeIo(async () => ({
	ttf: unpack(ttf),
	subsetter: await createSubsetter(unpack(subsetWasm))
}));
process.exitCode = await run(process.argv.slice(2), io);
export {};
