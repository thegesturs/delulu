import { UserButton } from "@delulu/auth";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@delulu/design-system/components/ui/breadcrumb";
import { Separator } from "@delulu/design-system/components/ui/separator";
import { SidebarTrigger } from "@delulu/design-system/components/ui/sidebar";
import { Fragment, type ReactNode } from "react";

interface HeaderProps {
  pages: string[];
  page: string;
  children?: ReactNode;
}

export const Header = ({ pages, page, children }: HeaderProps) => (
  <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
    <div className="flex items-center gap-2">
      <div className="font-bold text-lg md:hidden">Delulu</div>
      <SidebarTrigger className="-ml-1 hidden md:flex" />
      <Separator className="mr-2 hidden h-4 md:block" orientation="vertical" />
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {pages.map((page, index) => (
            <Fragment key={page}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">{page}</BreadcrumbLink>
              </BreadcrumbItem>
            </Fragment>
          ))}
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{page}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
    <div className="flex items-center gap-2">
      {children}
      <div className="md:hidden">
        <UserButton />
      </div>
    </div>
  </header>
);
