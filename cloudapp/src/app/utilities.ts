/** Maps object based on passed in function and returns object */
const mapObject = (object: any, mapFn: (value: any) => any): any => Object.keys(object).reduce(function(result: any, key: string) {
    result[key] = mapFn(object[key])
    return result
  }, {} as any);

/** Chunks array and returns array of arrays of specified size */
const chunk = <T>(inputArray: Array<T>, size:number): Array<Array<T>> => {
  return inputArray.reduce((all: Array<Array<T>>, one: T, i: number) => {
    const ch = Math.floor(i/size); 
    all[ch] = (all[ch] || []).concat([one]) as Array<T>; 
    return all;
  }, [] as Array<Array<T>>);
};

/** Asynchronously executes the function for each element in the array */
const asyncForEach = async <T>(array: T[], callback: (item: T, i: number, a: T[]) => Promise<any>) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

/** Checks if object is empty */
const isEmptyObject = (obj: Object) => Object.keys(obj).length === 0 && obj.constructor === Object;

/** Checks if a string is empty */
const isEmptyString = (value: string | null | undefined): boolean => {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  return false;
};

/** Handles either resolved or rejected Promise */
const reflect = (p: Promise<any>) => p.then((v: any) => ({v, status: "fulfilled" }), (e: any) => ({e, status: "rejected" }));

/** Downloads file */
const download = (filename: string, filetype: string, contents: string) => {
  var element = document.createElement('a');
  element.setAttribute('href', `data:${filetype};charset=utf-8,` + encodeURIComponent(contents));
  element.setAttribute('download', `${filename}`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

/** Safe JSON parse */
const tryParse = (val: string) => {
  try {
    return JSON.parse(val);
  } catch(e) {
    return null;
  }
};

/** Merge properties of source object to target including nested objects */
const deepMergeObjects = (target: any, source: any): any => {
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          deepMergeObjects(target[key], source[key]);
      } else {
          Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return target;
};

const isObject = (item: any) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

const enum CustomResponseType {
  info,
  warn,
  error
};

interface CustomResponse {
  message: string;
  type: CustomResponseType;
};

export { mapObject, chunk, asyncForEach, isEmptyObject, isEmptyString, reflect, download, tryParse, deepMergeObjects, CustomResponse, CustomResponseType };