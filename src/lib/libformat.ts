import {
	processCategory,
	processGender,
	processVerbCategory,
	processArticle
} from './libwordcategories';
export default function formatCategoryString(sense: Definition) {
	if (!sense) return '';
	const parts: string[] = [];

	const article = processArticle(sense.article);
	const category = processCategory(sense.category);
	const verbCategory =
		sense.category === 'verb' ? processVerbCategory(sense.verb_category) : '';
	const gender = processGender(sense.gender);

	if (category) parts.push(category);
	if (article) parts.push(article);
	if (verbCategory) parts.push(verbCategory);
	if (gender) parts.push(gender);
	return parts.length ? parts.join(' ') : '';
}
