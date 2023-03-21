import { excelIterator } from "./excelIterator";

export const excelFileHandler = async (excelFile) => {
	let a = await excelIterator(excelFile);

    console.log(a.length)

	if ((a.length === 0)) {
		return {
			error: true,
			code: 500,
			message: "0 addresses found",
			list: a,
		};
	} else {
		return {
			error: false,
			code: 200,
			message: `${a.length} valid addresses found`,
			list: a,
		};
	}
};
