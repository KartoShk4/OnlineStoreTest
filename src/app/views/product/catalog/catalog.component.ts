import {Component, ElementRef, HostListener, Input, OnInit} from '@angular/core';
import {ProductService} from "../../../shared/services/product.service";
import {ProductType} from "../../../../types/product.type";
import {CategoryService} from "../../../shared/services/category.service";
import {CategoryWithTypeType} from "../../../../types/category-with-type.type";
import {ActivatedRoute, Router} from "@angular/router";
import {ActiveParamsUtil} from "../../../shared/utils/active-params.util";
import {ActiveParamsType} from "../../../../types/active-params.type";
import {AppliedFilterType} from "../../../../types/applied-filter.type";
import {debounceTime} from "rxjs";
import {CartService} from "../../../shared/services/cart.service";
import {CartType} from "../../../../types/cart.type";
import {FavoriteService} from "../../../shared/services/favorite.service";
import {FavoriteType} from "../../../../types/favorite.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {AuthService} from "../../../core/auth/auth.service";

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit {

  products: ProductType[] = [];
  categoriesWithTypes: CategoryWithTypeType[] = [];
  activeParams: ActiveParamsType = {types: []};
  appliedFilters: AppliedFilterType[] = [];
  sortingOpen = false;
  sortingOptions: { name: string, value: string }[] = [
    {name: "От А до Я", value: "az-asc"},
    {name: "От Я до А", value: "az-desc"},
    {name: "По возрастанию цены", value: "price-asc"},
    {name: "По убыванию цены", value: "price-desc"},
  ];


  pages: number[] = [];
  cart: CartType | null = null;
  favoriteProducts: FavoriteType[] | null = null;

  constructor(private productService: ProductService,
              private categoryService: CategoryService,
              private activatedRoute: ActivatedRoute,
              private cartService: CartService,
              private authService: AuthService,
              private favoriteService: FavoriteService,
              private router: Router,
              private eRef: ElementRef) {
  }

  ngOnInit(): void {
    this.cartService.getCart()
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        }
        this.cart = data as CartType;

        if (this.authService.getIsLoggedIn()) {
          this.favoriteService.getFavorites()
            .subscribe(
              {
                next: (data: FavoriteType[] | DefaultResponseType): void => {
                  if ((data as DefaultResponseType).error !== undefined) {
                    const error: string = (data as DefaultResponseType).message;
                    this.processCatalog();
                    throw new Error(error);
                  }
                  this.favoriteProducts = data as FavoriteType[];
                  this.processCatalog();
                },
                error: (error) => {
                  this.processCatalog();
                }
              });
        } else {
          this.processCatalog();
        }
      });
  }

  processCatalog(): void {
    this.categoryService.getCategoriesWithTypes()
      .subscribe(data => {
        this.categoriesWithTypes = data;
        this.favoriteService.getFavorites()
          .subscribe((data: FavoriteType[] | DefaultResponseType): void => {
            if ((data as DefaultResponseType).error !== undefined) {
              const error: string = (data as DefaultResponseType).message;
              throw new Error(error);
            }
            this.products = data as ProductType[];
          });

        this.activatedRoute.queryParams
          .pipe(
            debounceTime(500),
          )
          .subscribe(params => {
            this.activeParams = ActiveParamsUtil.processParams(params);

            this.appliedFilters = [];
            this.activeParams.types.forEach(url => {
              for (let i = 0; i < this.categoriesWithTypes.length; i++) {
                const foundType = this.categoriesWithTypes[i].types.find(type => type.url === url);
                if (foundType) {
                  this.appliedFilters.push({
                    name: foundType.name,
                    urlParam: foundType.url,
                  });
                }
              }
            });

            if (this.activeParams.heightFrom) {
              this.appliedFilters.push({
                name: 'Высота: от ' + this.activeParams.heightFrom + ' см',
                urlParam: 'heightFrom',
              })
            }

            if (this.activeParams.heightTo) {
              this.appliedFilters.push({
                name: 'Высота: до ' + this.activeParams.heightTo + ' см',
                urlParam: 'heightTo',
              })
            }

            if (this.activeParams.diameterFrom) {
              this.appliedFilters.push({
                name: 'Диаметр: от ' + this.activeParams.diameterFrom + ' см',
                urlParam: 'diameterFrom',
              })
            }

            if (this.activeParams.diameterTo) {
              this.appliedFilters.push({
                name: 'Диаметр: до ' + this.activeParams.diameterTo + ' см',
                urlParam: 'diameterTo',
              });
            }

            this.productService.getProducts(this.activeParams)
              .subscribe(data => {
                this.pages = [];
                for (let i: number = 1; i <= data.pages; i++) {
                  this.pages.push(i)
                }

                if (this.cart && this.cart.items.length > 0) {
                  this.products = data.items.map(product => {
                    if (this.cart) {
                      const productInCart = this.cart.items.find(item => item.product.id === product.id);
                      if (productInCart) {
                        product.countInCart = productInCart.quantity
                      }
                    }
                    return product;
                  });
                } else {
                  this.products = data.items;
                }

                if (this.favoriteProducts) {
                  this.products = this.products.map(product => {
                    const productInFavorite = this.favoriteProducts?.find(item => item.id === product.id);
                    if (productInFavorite) {
                      product.isInFavorite = true;
                    }
                    return product;
                  })
                }
              });

          });
      });
  };

  removeAppliedFilter(appliedFilter: AppliedFilterType) {
    if (appliedFilter.urlParam === 'heightFrom' || appliedFilter.urlParam === 'heightTo' ||
      appliedFilter.urlParam === 'diameterFrom' || appliedFilter.urlParam === 'diameterTo') {
      delete this.activeParams[appliedFilter.urlParam];
    } else {
      this.activeParams.types = this.activeParams.types.filter(item => item !== appliedFilter.urlParam);
    }

    this.activeParams.page = 1;
    this.router.navigate(['/catalog'], {
      queryParams: this.activeParams
    });
  }

  toggleSorting(): void {
    this.sortingOpen = !this.sortingOpen;
  }

  sort(value: string): void {
    this.activeParams.sort = value;
    this.router.navigate(['/catalog'], {
      queryParams: this.activeParams
    });
  }

  @HostListener('document:click', ['$event.target'])
  onClick(element: Element): void {
    if (!element.closest('.catalog-sorting')) this.sortingOpen = false;
  }


  openPage(page: number): void {
    this.activeParams.page = page;
    this.router.navigate(['/catalog'], {
      queryParams: this.activeParams
    });
  }

  openNextPage(): void {
    if (this.activeParams.page && this.activeParams.page < this.pages.length) {
      this.activeParams.page++;
      this.router.navigate(['/catalog'], {
        queryParams: this.activeParams
      });
    }
  }

  openPrevPage(): void {
    if (this.activeParams.page && this.activeParams.page > 1) {
      this.activeParams.page--;
      this.router.navigate(['/catalog'], {
        queryParams: this.activeParams
      });
    }
  }
}
