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
		count: 779,
		unicodeRange: "U+20-7E, U+A0-FF, U+2000-200B, U+2010-2023, U+2025-2026, U+202F-2037, U+2039-203F, U+2042, U+2044-2049, U+204B-204E, U+2051, U+205F, U+2190-2213, U+2215, U+2217-2220, U+2222-2223, U+2225-222E, U+2234-223D, U+2241-226B, U+226D-228B, U+228D-22A5, U+22B2-22B5, U+22B8, U+22BB-22BC, U+22C2-22C6, U+22CD-22D1, U+22DA-22E9, U+22EE-22EF, U+2500-257F, U+25A0-25FF, U+27DC, U+29A3"
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
		case "process": return;
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
			yield* seqIds(block.body);
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
var locales = ["en", "ko"];
var catalog = {
	en: {
		"if.yes": "true",
		"if.no": "false",
		"case.default": "default",
		"call.noName": "(no name)",
		"folded.count": "{count} blocks",
		"fold.more": "{text} and {count} more",
		"fold.empty": "(empty block)"
	},
	ko: {
		"if.yes": "참",
		"if.no": "거짓",
		"case.default": "default",
		"call.noName": "(이름 없음)",
		"folded.count": "블록 {count}개",
		"fold.more": "{text} 외 {count}개",
		"fold.empty": "(빈 블록)"
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
		case "call": return [];
		case "if": return [block.yes.body, block.no.body];
		case "case": return [...block.arms.map((arm) => arm.body), ...block.otherwise === null ? [] : [block.otherwise.body]];
		case "while":
		case "doWhile":
		case "for": return [block.body];
	}
}
/**
* Lists the ids that can be folded on a sequence, in document order: branches of If and Case,
* loop blocks and fold regions, and with `withSiteFolds` the site fold regions of call blocks.
*/
function* seqFoldableIds(seq, withSiteFolds) {
	for (const block of seq.blocks) yield* blockFoldableIds(block, withSiteFolds);
	for (const fold of seq.folds) yield fold.id;
}
function* blockFoldableIds(block, withSiteFolds) {
	switch (block.kind) {
		case "process": return;
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
	const text = (first === void 0 ? "" : first.kind === "call" ? callText(words, first) : first.text).split("\n")[0] ?? "";
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
		case "call": return measureCall(context, block, at);
		case "while":
		case "doWhile":
		case "for": return measureLoop(context, block, at, insets);
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
		case "call": return [];
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
		case "for": return [{
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
			case "process": return;
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
				checkSeq(block.body, block.id);
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
		case "process": return {
			id: block.id,
			kind: block.kind,
			text: block.text
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
	return locales.find((locale) => locale === value) ?? null;
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
		case "process": {
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
				kind: "process",
				text
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
