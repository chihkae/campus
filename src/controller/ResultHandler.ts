import {ResultTooLargeError} from "./IInsightFacade";
import QuerySorter from "./QuerySorter";
import QueryApplier from "./QueryApplier";
import QueryEvaluator from "./QueryEvaluator";
import {QueryValidator} from "./QueryValidator";
import QueryGrouper from "./QueryGrouper";


export class ResultHandler {
    private QGrouper: QueryGrouper;
    private QSorter: QuerySorter;
    private QApplier: QueryApplier;
    private QEvaluator: QueryEvaluator;
    private QValidator: QueryValidator;
    private static max = 5000;
    private isTransformed = false;
    private isSorted = false;
    private isSortedWithDirection = false;
    private id: any;
    private sortingKeys: any[];
    private dir: any;
    private groupKeys: any;
    private applyRulesTokenKeys: any[];
    private nonGroupKeys: any[];
    private selectKeys: any[];

    constructor(qEval: QueryEvaluator, qVal: QueryValidator) {
        this.QGrouper = new QueryGrouper();
        this.QSorter = new QuerySorter();
        this.QApplier = new QueryApplier();
        this.QEvaluator = qEval;
        this.QValidator = qVal;
    }

    private extractFormat() {
        if (this.QValidator.getQuery().getGroupKeys() !== undefined) {
            this.isTransformed = true;
            this.groupKeys = this.QValidator.getQuery().getGroupKeys();
            this.applyRulesTokenKeys = this.QValidator.getQuery().getApplyRulesTokenKeys();
            this.nonGroupKeys = this.QValidator.getQuery().getApplyKeys();
        }
        if (this.QValidator.getQuery().getOrderKey() !== undefined) {
            if (this.QValidator.getQuery().getDir() !== undefined) {
                this.isSorted = true;
                this.isSortedWithDirection = true;
                this.sortingKeys = this.QValidator.getQuery().getOrderKey();
                this.dir = this.QValidator.getQuery().getDir();
            } else {
                this.isSorted = true;
                this.sortingKeys = this.QValidator.getQuery().getOrderKey();
            }
        } else {
            this.isSorted = false;
        }
        this.id = this.QValidator.getQuery().getIdString();
        this.selectKeys = this.QValidator.getQuery().getColumnsKeyWithoutUnderscore();

    }

    public format(unsortedResult: any) {
        this.extractFormat();
        let finalResult: any[];
        if (this.isTransformed && this.isSorted && this.isSortedWithDirection) {
            let groupedResult = this.QGrouper.groupResult(this.groupKeys, unsortedResult);
            let appliedResult = this.QApplier.applytoGroup(groupedResult, this.applyRulesTokenKeys);
            let selectedColumnsResult = this.QEvaluator.selectColumns(appliedResult, this.selectKeys);
            let sorted = this.QSorter.sort(selectedColumnsResult, this.sortingKeys);
            sorted = this.QSorter.sortDirection(sorted, this.dir);
            finalResult = this.QEvaluator.addID(sorted, this.id, this.selectKeys, this.nonGroupKeys);
        } else if (this.isTransformed && this.isSorted && !this.isSortedWithDirection) {
            let groupedResult = this.QGrouper.groupResult(this.groupKeys, unsortedResult);
            let appliedResult = this.QApplier.applytoGroup(groupedResult, this.applyRulesTokenKeys);
            let selectedColumnsResult = this.QEvaluator.selectColumns(appliedResult, this.selectKeys);
            let sorted = this.QSorter.sort(selectedColumnsResult, this.sortingKeys);
            finalResult = this.QEvaluator.addID(sorted, this.id, this.selectKeys, this.nonGroupKeys);
        } else if (this.isSorted && this.isSortedWithDirection && !this.isTransformed) {
            let selectedColumnsResult = this.QEvaluator.selectColumns(unsortedResult, this.selectKeys);
            let sorted = this.QSorter.sort(selectedColumnsResult, this.sortingKeys);
            sorted = this.QSorter.sortDirection(sorted, this.dir);
            finalResult = this.QEvaluator.addID(sorted, this.id, this.selectKeys, this.nonGroupKeys);
        } else if (!this.isTransformed && this.isSorted && !this.isSortedWithDirection) {
            let selectedColumnsResult = this.QEvaluator.selectColumns(unsortedResult, this.selectKeys);
            let sorted = this.QSorter.sort(selectedColumnsResult, this.sortingKeys);
            finalResult = this.QEvaluator.addID(sorted, this.id, this.selectKeys, this.nonGroupKeys);
        } else if (!this.isTransformed && !this.isSorted && !this.isSortedWithDirection) {
            let selectedColumnsResult = this.QEvaluator.selectColumns(unsortedResult, this.selectKeys);
            finalResult =
                this.QEvaluator.addID(selectedColumnsResult, this.id, this.selectKeys, this.nonGroupKeys);
        }
        if (!this.isResultTooLarge(finalResult)) {
            return finalResult;
        } else {
            throw new ResultTooLargeError();
        }
    }

    private isResultTooLarge(result: any[]): boolean {
        if (Array.isArray(result)) {
            if (result.length > ResultHandler.max ) {
                return true;
            }
        }
        return false;
    }

}
