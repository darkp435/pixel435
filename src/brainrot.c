#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#define M 30000
// brainrot interpreter source code
void f(const char*b){unsigned char d[M]={0};int c=0;int a=0;while(b[a]){if(strncmp(&b[a],"skibidi",7)==0){d[c]++;a+=7;}else if(strncmp(
&b[a],"sigma",5)==0){d[c]--;a+=5;}else if(strncmp(&b[a],"rizz",4)==0){c++;a+=4;}else if(strncmp(&b[a],"ohio",4)==0){c--;a+=4;}else if(
strncmp(&b[a],"gyatt",5)==0){putchar(d[c]);putchar('\n');a+=5;}else if(strncmp(&b[a],"fanum tax",9)==0){a+=9;}else if(strncmp(&b[a],
"grimace shake",13)==0){d[c]=getchar();a+=13;}else if(strncmp(&b[a],"let him cook",12)==0){a+=12;}else if(b[a]=='['){if(d[c]==0){int e=1
;while(e>0){a++;if(b[a]=='[')e++;if(b[a]==']')e--;}}else{a++;}}else if(b[a]==']'){if(d[c]!=0){int e=1;while(e>0){a--;if(b[a]=='[')e--;if
(b[a]==']')e++;}}else{a++;}}else{a++;}}}int main(){char b[1024];printf("> ");fgets(b,sizeof(b),stdin);b[strcspn(b,"\n")]=0;f(b);return 0
;}