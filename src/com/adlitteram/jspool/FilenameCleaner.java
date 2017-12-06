/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.adlitteram.jspool;

/**
 *
 * @author Administrateur
 */
public class FilenameCleaner {

    public static String clean(String str) {
        return clean(str, CHAR_MAP);
    }

    public static String clean(String str, String[] charmap) {

        StringBuilder buffer = new StringBuilder(str.length());
        for (int i = 0; i < str.length(); i++) {
            int c = (int) str.charAt(i);
            if (c >= charmap.length) {
                c = c % charmap.length;
            }
            buffer.append(charmap[c]);
        }
        return buffer.toString();
    }

    // CHAR MAP
    public static final String[] CHAR_MAP = {
        "_", // 0 ,  
        "_", // 1 , 
        "_", // 2 , 
        "_", // 3 , 
        "_", // 4 , 
        "_", // 5 , 
        "_", // 6 , 
        "_", // 7 , 
        "_", // 8 , 
        "_", // 9 , 	
        "_", // 10 , 
        "_", // 11 , 
        "_", // 12 , 
        "_", // 13 , 
        "_", // 14 , 
        "_", // 15 , 
        "_", // 16 , 
        "_", // 17 , 
        "_", // 18 , 
        "_", // 19 , 
        "_", // 20 , 
        "_", // 21 , 
        "_", // 22 , 
        "_", // 23 , 
        "_", // 24 , 
        "_", // 25 , 
        "_", // 26 , 
        "_", // 27 , 
        "_", // 28 , 
        "_", // 29 , 
        "_", // 30 , 
        "_", // 31 , 
        " ", // 32 ,  
        "!", // 33 , !
        "_", // 34 , "
        "#", // 35 , #
        "$", // 36 , $
        "%", // 37 , %
        "_", // 38 , &
        "_", // 39 , '
        "(", // 40 , (
        ")", // 41 , )
        "_", // 42 , *
        "+", // 43 , +
        "_", // 44 , ,
        "-", // 45 , -
        ".", // 46 , .
        "_", // 47 , /
        "0", // 48 , 0
        "1", // 49 , 1
        "2", // 50 , 2
        "3", // 51 , 3
        "4", // 52 , 4
        "5", // 53 , 5
        "6", // 54 , 6
        "7", // 55 , 7
        "8", // 56 , 8
        "9", // 57 , 9
        "_", // 58 , :
        "_", // 59 , ;
        "_", // 60 , <
        "=", // 61 , =
        "_", // 62 , >
        "_", // 63 , ?
        "@", // 64 , @
        "A", // 65 , A
        "B", // 66 , B
        "C", // 67 , C
        "D", // 68 , D
        "E", // 69 , E
        "F", // 70 , F
        "G", // 71 , G
        "H", // 72 , H
        "I", // 73 , I
        "J", // 74 , J
        "K", // 75 , K
        "L", // 76 , L
        "M", // 77 , M
        "N", // 78 , N
        "O", // 79 , O
        "P", // 80 , P
        "Q", // 81 , Q
        "R", // 82 , R
        "S", // 83 , S
        "T", // 84 , T
        "U", // 85 , U
        "V", // 86 , V
        "W", // 87 , W
        "X", // 88 , X
        "Y", // 89 , Y
        "Z", // 90 , Z
        "[", // 91 , [
        "_", // 92 , \
        "]", // 93 , ]
        "_", // 94 , ^
        "_", // 95 , _
        "_", // 96 , `
        "a", // 97 , a
        "b", // 98 , b
        "c", // 99 , c
        "d", // 100 , d
        "e", // 101 , e
        "f", // 102 , f
        "g", // 103 , g
        "h", // 104 , h
        "i", // 105 , i
        "j", // 106 , j
        "k", // 107 , k
        "l", // 108 , l
        "m", // 109 , m
        "n", // 110 , n
        "o", // 111 , o
        "p", // 112 , p
        "q", // 113 , q
        "r", // 114 , r
        "s", // 115 , s
        "t", // 116 , t
        "u", // 117 , u
        "v", // 118 , v
        "w", // 119 , w
        "x", // 120 , x
        "y", // 121 , y
        "z", // 122 , z
        "{", // 123 , {
        "_", // 124 , |
        "}", // 125 , }
        "_", // 126 , ~
        "_", // 127 , 
        "_", // 128 , ?
        "-", // 129 , ?
        "-", // 130 , ?
        "-", // 131 , ?
        "-", // 132 , ?
        "-", // 133 , ?
        "-", // 134 , ?
        "-", // 135 , ?
        "-", // 136 , ?
        "-", // 137 , ?
        "-", // 138 , ?
        "-", // 139 , ?
        "-", // 140 , ?
        "-", // 141 , ?
        "-", // 142 , ?
        "-", // 143 , ?
        "-", // 144 , ?
        "-", // 145 , ?
        "-", // 146 , ?
        "-", // 147 , ?
        "-", // 148 , ?
        "-", // 149 , ?
        "-", // 150 , ?
        "-", // 151 , ?
        "-", // 152 , ?
        "-", // 153 , ?
        "-", // 154 , ?
        "-", // 155 , ?
        "-", // 156 , ?
        "-", // 157 , ?
        "-", // 158 , ?
        "-", // 159 , ?
        "_", // 160 , �
        "i", // 161 , �
        "c", // 162 , �
        "l", // 163 , �
        "x", // 164 , �
        "y", // 165 , �
        "_", // 166 , �
        "_", // 167 , �
        "_", // 168 , �
        "c", // 169 , �
        "2", // 170 , �
        "_", // 171 , �
        "_", // 172 , �
        "_", // 173 , �
        "_", // 174 , �
        "_", // 175 , �
        "_", // 176 , �
        "_", // 177 , �
        "2", // 178 , �
        "3", // 179 , �
        "_", // 180 , �
        "_", // 181 , �
        "_", // 182 , �
        "_", // 183 , �
        "_", // 184 , �
        "1", // 185 , �
        "0", // 186 , �
        "_", // 187 , �
        "14", // 188 , �
        "12", // 189 , �
        "34", // 190 , �
        "_", // 191 , �
        "A", // 192 , �
        "A", // 193 , �
        "A", // 194 , �
        "A", // 195 , �
        "A", // 196 , �
        "A", // 197 , �
        "AE", // 198 , �
        "C", // 199 , �
        "E", // 200 , �
        "E", // 201 , �
        "E", // 202 , �
        "E", // 203 , �
        "I", // 204 , �
        "I", // 205 , �
        "I", // 206 , �
        "I", // 207 , �
        "D", // 208 , �
        "N", // 209 , �
        "O", // 210 , �
        "O", // 211 , �
        "O", // 212 , �
        "O", // 213 , �
        "O", // 214 , �
        "x", // 215 , �
        "O", // 216 , �
        "U", // 217 , �
        "U", // 218 , �
        "U", // 219 , �
        "U", // 220 , �
        "Y", // 221 , �
        "F", // 222 , �
        "B", // 223 , �
        "a", // 224 , �
        "a", // 225 , �
        "a", // 226 , �
        "a", // 227 , �
        "a", // 228 , �
        "a", // 229 , �
        "ae", // 230 , �
        "c", // 231 , �
        "e", // 232 , �
        "e", // 233 , �
        "e", // 234 , �
        "e", // 235 , �
        "i", // 236 , �
        "i", // 237 , �
        "i", // 238 , �
        "i", // 239 , �
        "o", // 240 , �
        "n", // 241 , �
        "o", // 242 , �
        "o", // 243 , �
        "o", // 244 , �
        "o", // 245 , �
        "o", // 246 , �
        "_", // 247 , �
        "o", // 248 , �
        "u", // 249 , �
        "u", // 250 , �
        "u", // 251 , �
        "u", // 252 , �
        "y", // 253 , �
        "y", // 254 , �
        "y", // 255 , �

        "A", // 256 , ?
        "a", // 257 , ?
        "A", // 258 , ?
        "a", // 259 , ?
        "A", // 260 , ?
        "a", // 261 , ?
        "C", // 262 , ?
        "c", // 263 , ?
        "C", // 264 , ?
        "c", // 265 , ?
        "C", // 266 , ?
        "c", // 267 , ?
        "C", // 268 , ?
        "c", // 269 , ?
        "D", // 270 , ?
        "d", // 271 , ?
        "D", // 272 , ?
        "d", // 273 , ?
        "E", // 274 , ?
        "e", // 275 , ?
        "E", // 276 , ?
        "e", // 277 , ?
        "E", // 278 , ?
        "e", // 279 , ?
        "E", // 280 , ?
        "e", // 281 , ?
        "E", // 282 , ?
        "e", // 283 , ?
        "G", // 284 , ?
        "g", // 285 , ?
        "G", // 286 , ?
        "g", // 287 , ?
        "G", // 288 , ?
        "g", // 289 , ?
        "G", // 290 , ?
        "g", // 291 , ?
        "H", // 292 , ?
        "h", // 293 , ?
        "H", // 294 , ?
        "h", // 295 , ?
        "I", // 296 , ?
        "i", // 297 , ?
        "I", // 298 , ?
        "i", // 299 , ?
        "I", // 300 , ?
        "i", // 301 , ?
        "I", // 302 , ?
        "i", // 303 , ?
        "I", // 304 , ?
        "i", // 305 , ?
        "IJ", // 306 , ?
        "ij", // 307 , ?
        "J", // 308 , ?
        "j", // 309 , ?
        "K", // 310 , ?
        "k", // 311 , ?
        "k", // 312 , ?
        "L", // 313 , ?
        "l", // 314 , ?
        "L", // 315 , ?
        "l", // 316 , ?
        "L", // 317 , ?
        "l", // 318 , ?
        "L", // 319 , ?
        "l", // 320 , ?
        "L", // 321 , ?
        "l", // 322 , ?
        "N", // 323 , ?
        "n", // 324 , ?
        "N", // 325 , ?
        "n", // 326 , ?
        "N", // 327 , ?
        "n", // 328 , ?
        "n", // 329 , ?
        "N", // 330 , ?
        "n", // 331 , ?
        "O", // 332 , ?
        "o", // 333 , ?
        "O", // 334 , ?
        "o", // 335 , ?
        "O", // 336 , ?
        "o", // 337 , ?
        "OE", // 338 , �
        "oe", // 349 , �
        "R", // 340 , ?
        "r", // 341 , ?
        "R", // 342 , ?
        "r", // 343 , ?
        "R", // 344 , ?
        "r", // 345 , ?
        "S", // 346 , ?
        "s", // 347 , ?
        "S", // 348 , ?
        "s", // 349 , ?
        "S", // 350 , ?
        "s", // 351 , ?
        "S", // 352 , �
        "s", // 353 , �
        "T", // 354 , ?
        "t", // 355 , ?
        "T", // 356 , ?
        "t", // 357 , ?
        "T", // 358 , ?
        "t", // 359 , ?
        "U", // 360 , ?
        "u", // 361 , ?
        "U", // 362 , ?
        "u", // 363 , ?
        "U", // 364 , ?
        "u", // 365 , ?
        "U", // 366 , ?
        "u", // 367 , ?
        "U", // 368 , ?
        "u", // 369 , ?
        "U", // 370 , ?
        "u", // 371 , ?
        "W", // 372 , ?
        "w", // 373 , ?
        "Y", // 374 , ?
        "y", // 375 , ?
        "�", // 376 , �
        "Z", // 377 , ?
        "z", // 378 , ?
        "Z", // 379 , ?
        "z", // 380 , ?
        "Z", // 381 , �
        "z", // 382 , �
        "_", // 383 , ?
    };
}
